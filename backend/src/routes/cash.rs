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

const MOVEMENT_TYPES: &[&str] = &["In", "Out"];

#[derive(Serialize)]
pub struct CashSessionResponse {
    id: Uuid,
    workspace_name: String,
    cashier_id: Uuid,
    cashier_email: String,
    opening_float: Decimal,
    status: String,
    cash_in: Decimal,
    cash_out: Decimal,
    expected_cash: Option<Decimal>,
    actual_cash: Option<Decimal>,
    variance: Option<Decimal>,
    opened_at: DateTime<Utc>,
    closed_at: Option<DateTime<Utc>>,
}

pub async fn list_sessions(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<CashSessionResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let sessions = sqlx::query_as!(
        CashSessionResponse,
        r#"
        SELECT
            cs.id, w.name AS workspace_name, cs.cashier_id, u.email AS cashier_email,
            cs.opening_float, cs.status,
            COALESCE(m.cash_in, 0) AS "cash_in!",
            COALESCE(m.cash_out, 0) AS "cash_out!",
            cs.expected_cash, cs.actual_cash, cs.variance,
            cs.opened_at, cs.closed_at
        FROM cash_sessions cs
        JOIN workspaces w ON w.id = cs.workspace_id
        JOIN users u ON u.id = cs.cashier_id
        LEFT JOIN (
            SELECT
                session_id,
                SUM(amount) FILTER (WHERE movement_type = 'In') AS cash_in,
                SUM(amount) FILTER (WHERE movement_type = 'Out') AS cash_out
            FROM cash_movements
            GROUP BY session_id
        ) m ON m.session_id = cs.id
        WHERE cs.tenant_id = $1
        ORDER BY cs.opened_at DESC
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(sessions))
}

#[derive(Deserialize)]
pub struct OpenShiftRequest {
    workspace_id: Uuid,
    opening_float: Decimal,
}

pub async fn open_shift(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<OpenShiftRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.opening_float < Decimal::ZERO {
        return Err(AppError::Validation("opening float cannot be negative".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let existing_open = sqlx::query_scalar!(
        r#"SELECT id FROM cash_sessions WHERE tenant_id = $1 AND cashier_id = $2 AND status = 'Open'"#,
        tenant_id,
        auth_user.user_id
    )
    .fetch_optional(&state.db)
    .await?;

    if existing_open.is_some() {
        return Err(AppError::Validation("you already have an open cash session".to_string()));
    }

    let id = sqlx::query_scalar!(
        r#"
        INSERT INTO cash_sessions (tenant_id, workspace_id, cashier_id, opening_float)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        "#,
        tenant_id,
        req.workspace_id,
        auth_user.user_id,
        req.opening_float
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "open_shift", "cash_management")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "id": id })))
}

#[derive(Deserialize)]
pub struct RecordMovementRequest {
    movement_type: String,
    amount: Decimal,
    reason: Option<String>,
}

pub async fn record_movement(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(session_id): Path<Uuid>,
    Json(req): Json<RecordMovementRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if !MOVEMENT_TYPES.contains(&req.movement_type.as_str()) {
        return Err(AppError::Validation(format!("unknown movement type '{}'", req.movement_type)));
    }
    if req.amount <= Decimal::ZERO {
        return Err(AppError::Validation("amount must be greater than zero".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let session_status = sqlx::query_scalar!(
        "SELECT status FROM cash_sessions WHERE id = $1 AND tenant_id = $2",
        session_id,
        tenant_id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Validation("cash session not found".to_string()))?;

    if session_status != "Open" {
        return Err(AppError::Validation("cash session is already closed".to_string()));
    }

    // Cash going OUT (expenses/petty cash) is exactly the "payment" event
    // the approval engine exists for: if a workflow is configured for
    // cash_expense and the amount crosses its threshold, the movement is
    // NOT recorded yet — it's created only once the request clears every
    // approval step (see approval_engine::dispatch_approved_payload).
    if req.movement_type == "Out" {
        let pending = approval_engine::evaluate(
            &state,
            approval_engine::EvaluateRequest {
                tenant_id,
                trigger_type: "cash_expense",
                module: "cash_management",
                amount: req.amount,
                reference_type: "cash_movement",
                reference_id: session_id,
                description: format!("Cash-out of KES {} needs approval before it's recorded", req.amount),
                requested_by: auth_user.user_id,
                payload: Some(serde_json::json!({
                    "session_id": session_id,
                    "amount": req.amount,
                    "reason": req.reason,
                    "requested_by": auth_user.user_id,
                })),
            },
        )
        .await?;

        if let Some(request_id) = pending {
            return Ok(Json(serde_json::json!({ "ok": true, "pending_approval": true, "request_id": request_id })));
        }
    }

    sqlx::query!(
        r#"
        INSERT INTO cash_movements (tenant_id, session_id, movement_type, amount, reason, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
        tenant_id,
        session_id,
        req.movement_type,
        req.amount,
        req.reason.as_deref(),
        auth_user.user_id
    )
    .execute(&state.db)
    .await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "record_cash_movement", "cash_management")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true, "pending_approval": false })))
}

#[derive(Deserialize)]
pub struct CloseShiftRequest {
    actual_cash: Decimal,
    notes: Option<String>,
}

pub async fn close_shift(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(session_id): Path<Uuid>,
    Json(req): Json<CloseShiftRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let mut tx = state.db.begin().await?;

    let session = sqlx::query!(
        r#"SELECT opening_float, status FROM cash_sessions WHERE id = $1 AND tenant_id = $2 FOR UPDATE"#,
        session_id,
        tenant_id
    )
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::Validation("cash session not found".to_string()))?;

    if session.status != "Open" {
        return Err(AppError::Validation("cash session is already closed".to_string()));
    }

    let totals = sqlx::query!(
        r#"
        SELECT
            COALESCE(SUM(amount) FILTER (WHERE movement_type = 'In'), 0) AS "cash_in!",
            COALESCE(SUM(amount) FILTER (WHERE movement_type = 'Out'), 0) AS "cash_out!"
        FROM cash_movements
        WHERE session_id = $1
        "#,
        session_id
    )
    .fetch_one(&mut *tx)
    .await?;

    let expected_cash: Decimal = session.opening_float + totals.cash_in - totals.cash_out;
    let variance: Decimal = req.actual_cash - expected_cash;

    sqlx::query!(
        r#"
        UPDATE cash_sessions
        SET status = 'Closed', expected_cash = $2, actual_cash = $3, variance = $4, notes = $5, closed_at = now()
        WHERE id = $1
        "#,
        session_id,
        expected_cash,
        req.actual_cash,
        variance,
        req.notes.as_deref()
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "close_shift", "cash_management")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "expected_cash": expected_cash, "variance": variance })))
}

#[derive(Serialize)]
pub struct CashMovementResponse {
    id: Uuid,
    workspace_name: String,
    cashier_email: Option<String>,
    movement_type: String,
    amount: Decimal,
    reason: Option<String>,
    created_at: DateTime<Utc>,
}

pub async fn list_movements(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<CashMovementResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let movements = sqlx::query_as!(
        CashMovementResponse,
        r#"
        SELECT
            cm.id, w.name AS workspace_name, u.email AS "cashier_email?",
            cm.movement_type, cm.amount, cm.reason, cm.created_at
        FROM cash_movements cm
        JOIN cash_sessions cs ON cs.id = cm.session_id
        JOIN workspaces w ON w.id = cs.workspace_id
        LEFT JOIN users u ON u.id = cm.created_by
        WHERE cm.tenant_id = $1
        ORDER BY cm.created_at DESC
        LIMIT 100
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(movements))
}
