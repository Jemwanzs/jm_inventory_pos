use rust_decimal::Decimal;
use serde_json::Value as JsonValue;
use uuid::Uuid;

use crate::{error::AppError, state::AppState};

pub struct EvaluateRequest<'a> {
    pub tenant_id: Uuid,
    pub trigger_type: &'a str,
    pub module: &'a str,
    pub amount: Decimal,
    pub reference_type: &'a str,
    pub reference_id: Uuid,
    pub description: String,
    pub requested_by: Uuid,
    pub payload: Option<JsonValue>,
}

/// Checks for an active workflow matching `trigger_type` whose threshold
/// (if any) is exceeded by `amount`. If one matches, creates a Pending
/// approval_requests row at step 1 and notifies (in-app + email) that
/// step's approver, returning the request id. Callers use the id to gate
/// whatever the request is blocking. Returns None when no workflow is
/// configured for this trigger (or the amount doesn't cross the
/// threshold) — meaning the action proceeds immediately, no approval
/// needed. This intentionally runs outside the caller's own transaction
/// (if any): a business record can in rare cases be created without a
/// matching approval row if this call fails independently, which fails
/// open rather than corrupting the caller's transaction — an accepted
/// trade-off for keeping this reusable across modules.
pub async fn evaluate(state: &AppState, req: EvaluateRequest<'_>) -> Result<Option<Uuid>, AppError> {
    let workflow = sqlx::query!(
        r#"
        SELECT id FROM approval_workflows
        WHERE tenant_id = $1 AND trigger_type = $2 AND is_active
          AND (threshold IS NULL OR $3 > threshold)
        ORDER BY created_at DESC
        LIMIT 1
        "#,
        req.tenant_id,
        req.trigger_type,
        req.amount
    )
    .fetch_optional(&state.db)
    .await?;

    let Some(workflow) = workflow else { return Ok(None) };

    let steps = sqlx::query!(
        r#"SELECT approver_user_id FROM approval_workflow_steps WHERE workflow_id = $1 ORDER BY step_order"#,
        workflow.id
    )
    .fetch_all(&state.db)
    .await?;

    if steps.is_empty() {
        return Ok(None);
    }

    let total_steps = steps.len() as i32;

    let request_id = sqlx::query_scalar!(
        r#"
        INSERT INTO approval_requests (
            tenant_id, module, reference_type, reference_id, description,
            requested_by, workflow_id, step_order, total_steps, payload
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9)
        RETURNING id
        "#,
        req.tenant_id,
        req.module,
        req.reference_type,
        req.reference_id,
        req.description,
        req.requested_by,
        workflow.id,
        total_steps,
        req.payload
    )
    .fetch_one(&state.db)
    .await?;

    notify(
        state,
        req.tenant_id,
        steps[0].approver_user_id,
        "Approval needed",
        &req.description,
        request_id,
    )
    .await;

    Ok(Some(request_id))
}

/// Writes an in-app notification and best-effort sends the matching
/// email. Failures are logged, not propagated — a notification hiccup
/// should never block the underlying business action.
pub async fn notify(state: &AppState, tenant_id: Uuid, user_id: Uuid, title: &str, body: &str, request_id: Uuid) {
    let insert = sqlx::query!(
        r#"
        INSERT INTO notifications (tenant_id, user_id, title, body, link_module, link_reference_id)
        VALUES ($1, $2, $3, $4, 'approvals', $5)
        "#,
        tenant_id,
        user_id,
        title,
        body,
        request_id
    )
    .execute(&state.db)
    .await;

    if let Err(err) = insert {
        tracing::warn!(?err, "failed to write in-app notification");
    }

    match sqlx::query_scalar!("SELECT email FROM users WHERE id = $1", user_id)
        .fetch_one(&state.db)
        .await
    {
        Ok(email) => {
            let html = format!("<p>{body}</p><p>Review it in Approvals Center &gt; Pending Approvals.</p>");
            if let Err(err) = state.email.send(&email, title, &html).await {
                tracing::warn!(?err, "failed to send notification email");
            }
        }
        Err(err) => tracing::warn!(?err, "failed to look up approver email"),
    }
}

/// Executes the deferred action for a request that gated its own
/// creation (rather than a later action, like Purchase Orders gating
/// Receive). Only cash_expense uses this today.
pub async fn dispatch_approved_payload(
    state: &AppState,
    tenant_id: Uuid,
    trigger_type: &str,
    payload: Option<JsonValue>,
) -> Result<(), AppError> {
    let Some(payload) = payload else { return Ok(()) };

    if trigger_type == "cash_expense" {
        let session_id: Uuid = serde_json::from_value(payload["session_id"].clone())
            .map_err(|_| AppError::Validation("invalid approval payload".to_string()))?;
        let amount: Decimal = serde_json::from_value(payload["amount"].clone())
            .map_err(|_| AppError::Validation("invalid approval payload".to_string()))?;
        let reason = payload["reason"].as_str();
        let requested_by: Uuid = serde_json::from_value(payload["requested_by"].clone())
            .map_err(|_| AppError::Validation("invalid approval payload".to_string()))?;

        sqlx::query!(
            r#"
            INSERT INTO cash_movements (tenant_id, session_id, movement_type, amount, reason, created_by)
            VALUES ($1, $2, 'Out', $3, $4, $5)
            "#,
            tenant_id,
            session_id,
            amount,
            reason,
            requested_by
        )
        .execute(&state.db)
        .await?;
    }

    Ok(())
}
