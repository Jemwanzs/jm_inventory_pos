use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    approval_engine, audit, auth::extractor::AuthUser, error::AppError, state::AppState,
    tenant::resolve_tenant_id,
};

// Trigger types a workflow can be configured against. Each one is wired
// into exactly one business action — see procurement.rs (purchase_order_create)
// and cash.rs (cash_expense) — adding a new critical action to the engine
// means adding both a trigger type here and an evaluate() call at the
// action's creation point.
const TRIGGER_TYPES: &[&str] = &["purchase_order_create", "cash_expense"];

#[derive(Serialize)]
pub struct ApprovalRequestResponse {
    id: Uuid,
    module: String,
    reference_type: String,
    reference_id: Uuid,
    description: String,
    status: String,
    requested_by_email: String,
    decided_by_email: Option<String>,
    decision_notes: Option<String>,
    step_order: i32,
    total_steps: i32,
    created_at: DateTime<Utc>,
    decided_at: Option<DateTime<Utc>>,
}

pub async fn list_pending(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<ApprovalRequestResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    // Only the assigned approver for the CURRENT step sees a workflow-
    // governed request; requests with no workflow (legacy/manual) remain
    // visible to anyone, matching the original behavior.
    let requests = sqlx::query_as!(
        ApprovalRequestResponse,
        r#"
        SELECT
            ar.id, ar.module, ar.reference_type, ar.reference_id, ar.description, ar.status,
            ru.email AS requested_by_email,
            du.email AS "decided_by_email?",
            ar.decision_notes, ar.step_order, ar.total_steps, ar.created_at, ar.decided_at
        FROM approval_requests ar
        JOIN users ru ON ru.id = ar.requested_by
        LEFT JOIN users du ON du.id = ar.decided_by
        LEFT JOIN approval_workflow_steps aws
            ON aws.workflow_id = ar.workflow_id AND aws.step_order = ar.step_order
        WHERE ar.tenant_id = $1 AND ar.status = 'Pending'
          AND (aws.approver_user_id = $2 OR aws.approver_user_id IS NULL)
        ORDER BY ar.created_at DESC
        "#,
        tenant_id,
        auth_user.user_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(requests))
}

pub async fn list_my_requests(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<ApprovalRequestResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let requests = sqlx::query_as!(
        ApprovalRequestResponse,
        r#"
        SELECT
            ar.id, ar.module, ar.reference_type, ar.reference_id, ar.description, ar.status,
            ru.email AS requested_by_email,
            du.email AS "decided_by_email?",
            ar.decision_notes, ar.step_order, ar.total_steps, ar.created_at, ar.decided_at
        FROM approval_requests ar
        JOIN users ru ON ru.id = ar.requested_by
        LEFT JOIN users du ON du.id = ar.decided_by
        WHERE ar.tenant_id = $1 AND ar.requested_by = $2
        ORDER BY ar.created_at DESC
        "#,
        tenant_id,
        auth_user.user_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(requests))
}

#[derive(Deserialize)]
pub struct DecideRequest {
    notes: Option<String>,
}

pub async fn approve_request(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<DecideRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    decide(&state, &auth_user, id, true, req.notes).await
}

pub async fn reject_request(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<DecideRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    decide(&state, &auth_user, id, false, req.notes).await
}

async fn decide(
    state: &AppState,
    auth_user: &AuthUser,
    id: Uuid,
    approve: bool,
    notes: Option<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, auth_user).await?;

    let mut tx = state.db.begin().await?;

    let request = sqlx::query!(
        r#"
        SELECT
            ar.workflow_id, ar.step_order, ar.total_steps, ar.status, ar.requested_by,
            ar.description, ar.payload,
            aw.trigger_type AS "trigger_type?"
        FROM approval_requests ar
        LEFT JOIN approval_workflows aw ON aw.id = ar.workflow_id
        WHERE ar.id = $1 AND ar.tenant_id = $2
        FOR UPDATE OF ar
        "#,
        id,
        tenant_id
    )
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::Validation("approval request not found".to_string()))?;

    if request.status != "Pending" {
        return Err(AppError::Validation("approval request already decided".to_string()));
    }

    if let Some(workflow_id) = request.workflow_id {
        let step_approver = sqlx::query_scalar!(
            r#"SELECT approver_user_id FROM approval_workflow_steps WHERE workflow_id = $1 AND step_order = $2"#,
            workflow_id,
            request.step_order
        )
        .fetch_optional(&mut *tx)
        .await?;

        if let Some(approver_id) = step_approver {
            if approver_id != auth_user.user_id {
                return Err(AppError::Validation("you are not the assigned approver for this step".to_string()));
            }
        }
    }

    if !approve {
        sqlx::query!(
            r#"UPDATE approval_requests SET status = 'Rejected', decided_by = $3, decision_notes = $4, decided_at = now() WHERE id = $1 AND tenant_id = $2"#,
            id,
            tenant_id,
            auth_user.user_id,
            notes.as_deref()
        )
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        approval_engine::notify(
            state,
            tenant_id,
            request.requested_by,
            "Request rejected",
            &format!("Your request was rejected: {}", request.description),
            id,
        )
        .await;

        audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "reject_request", "approvals")
            .await
            .map_err(AppError::Internal)?;

        return Ok(Json(serde_json::json!({ "ok": true, "status": "Rejected" })));
    }

    if request.step_order < request.total_steps {
        let next_step = request.step_order + 1;

        sqlx::query!("UPDATE approval_requests SET step_order = $2 WHERE id = $1", id, next_step)
            .execute(&mut *tx)
            .await?;

        let next_approver = match request.workflow_id {
            Some(workflow_id) => {
                sqlx::query_scalar!(
                    r#"SELECT approver_user_id FROM approval_workflow_steps WHERE workflow_id = $1 AND step_order = $2"#,
                    workflow_id,
                    next_step
                )
                .fetch_optional(&mut *tx)
                .await?
            }
            None => None,
        };

        tx.commit().await?;

        if let Some(approver_id) = next_approver {
            approval_engine::notify(state, tenant_id, approver_id, "Approval needed", &request.description, id).await;
        }

        audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "approve_request_step", "approvals")
            .await
            .map_err(AppError::Internal)?;

        return Ok(Json(serde_json::json!({ "ok": true, "status": "Pending", "step_order": next_step })));
    }

    sqlx::query!(
        r#"UPDATE approval_requests SET status = 'Approved', decided_by = $3, decision_notes = $4, decided_at = now() WHERE id = $1 AND tenant_id = $2"#,
        id,
        tenant_id,
        auth_user.user_id,
        notes.as_deref()
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    if let Some(trigger_type) = &request.trigger_type {
        approval_engine::dispatch_approved_payload(state, tenant_id, trigger_type, request.payload.clone()).await?;
    }

    approval_engine::notify(
        state,
        tenant_id,
        request.requested_by,
        "Request approved",
        &format!("Your request was approved: {}", request.description),
        id,
    )
    .await;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "approve_request", "approvals")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true, "status": "Approved" })))
}

#[derive(Serialize)]
pub struct WorkflowStepResponse {
    step_order: i32,
    approver_user_id: Uuid,
    approver_name: String,
}

#[derive(Serialize)]
pub struct WorkflowResponse {
    id: Uuid,
    name: String,
    trigger_type: String,
    threshold: Option<Decimal>,
    is_active: bool,
    steps: Vec<WorkflowStepResponse>,
}

pub async fn list_workflows(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<WorkflowResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let workflows = sqlx::query!(
        r#"SELECT id, name, trigger_type, threshold, is_active FROM approval_workflows WHERE tenant_id = $1 ORDER BY created_at DESC"#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    let mut result = Vec::with_capacity(workflows.len());
    for w in workflows {
        let steps = sqlx::query_as!(
            WorkflowStepResponse,
            r#"
            SELECT aws.step_order, aws.approver_user_id, u.full_name AS approver_name
            FROM approval_workflow_steps aws
            JOIN users u ON u.id = aws.approver_user_id
            WHERE aws.workflow_id = $1
            ORDER BY aws.step_order
            "#,
            w.id
        )
        .fetch_all(&state.db)
        .await?;

        result.push(WorkflowResponse {
            id: w.id,
            name: w.name,
            trigger_type: w.trigger_type,
            threshold: w.threshold,
            is_active: w.is_active,
            steps,
        });
    }

    Ok(Json(result))
}

#[derive(Deserialize)]
pub struct StepRequest {
    approver_user_id: Uuid,
}

#[derive(Deserialize)]
pub struct CreateWorkflowRequest {
    name: String,
    trigger_type: String,
    threshold: Option<Decimal>,
    steps: Vec<StepRequest>,
}

pub async fn create_workflow(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateWorkflowRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation("name is required".to_string()));
    }
    if !TRIGGER_TYPES.contains(&req.trigger_type.as_str()) {
        return Err(AppError::Validation(format!("unknown trigger type '{}'", req.trigger_type)));
    }
    if req.steps.is_empty() {
        return Err(AppError::Validation("a workflow needs at least one approval step".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let mut tx = state.db.begin().await?;

    let workflow_id = sqlx::query_scalar!(
        r#"
        INSERT INTO approval_workflows (tenant_id, name, trigger_type, threshold, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        "#,
        tenant_id,
        req.name.trim(),
        req.trigger_type,
        req.threshold,
        auth_user.user_id
    )
    .fetch_one(&mut *tx)
    .await?;

    for (index, step) in req.steps.iter().enumerate() {
        sqlx::query!(
            r#"INSERT INTO approval_workflow_steps (workflow_id, step_order, approver_user_id) VALUES ($1, $2, $3)"#,
            workflow_id,
            (index + 1) as i32,
            step.approver_user_id
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_approval_workflow", "approvals")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "id": workflow_id })))
}

#[derive(Deserialize)]
pub struct UpdateWorkflowActiveRequest {
    is_active: bool,
}

pub async fn update_workflow_active(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateWorkflowActiveRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let updated = sqlx::query!(
        "UPDATE approval_workflows SET is_active = $3 WHERE id = $1 AND tenant_id = $2",
        id,
        tenant_id,
        req.is_active
    )
    .execute(&state.db)
    .await?;

    if updated.rows_affected() == 0 {
        return Err(AppError::Validation("workflow not found".to_string()));
    }

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "update_approval_workflow", "approvals")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn delete_workflow(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let deleted = sqlx::query!("DELETE FROM approval_workflows WHERE id = $1 AND tenant_id = $2", id, tenant_id)
        .execute(&state.db)
        .await?;

    if deleted.rows_affected() == 0 {
        return Err(AppError::Validation("workflow not found".to_string()));
    }

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "delete_approval_workflow", "approvals")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}
