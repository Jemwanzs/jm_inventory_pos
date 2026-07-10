use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

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
    created_at: DateTime<Utc>,
    decided_at: Option<DateTime<Utc>>,
}

pub async fn list_pending(
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
            ar.decision_notes, ar.created_at, ar.decided_at
        FROM approval_requests ar
        JOIN users ru ON ru.id = ar.requested_by
        LEFT JOIN users du ON du.id = ar.decided_by
        WHERE ar.tenant_id = $1 AND ar.status = 'Pending'
        ORDER BY ar.created_at DESC
        "#,
        tenant_id
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
            ar.decision_notes, ar.created_at, ar.decided_at
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
    decide(&state, &auth_user, id, "Approved", req.notes).await
}

pub async fn reject_request(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<DecideRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    decide(&state, &auth_user, id, "Rejected", req.notes).await
}

async fn decide(
    state: &AppState,
    auth_user: &AuthUser,
    id: Uuid,
    status: &str,
    notes: Option<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, auth_user).await?;

    let updated = sqlx::query!(
        r#"
        UPDATE approval_requests
        SET status = $3, decided_by = $4, decision_notes = $5, decided_at = now()
        WHERE id = $1 AND tenant_id = $2 AND status = 'Pending'
        "#,
        id,
        tenant_id,
        status,
        auth_user.user_id,
        notes.as_deref()
    )
    .execute(&state.db)
    .await?;

    if updated.rows_affected() == 0 {
        return Err(AppError::Validation("approval request not found or already decided".to_string()));
    }

    audit::record(
        &state.db,
        Some(tenant_id),
        Some(auth_user.user_id),
        if status == "Approved" { "approve_request" } else { "reject_request" },
        "approvals",
    )
    .await
    .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}
