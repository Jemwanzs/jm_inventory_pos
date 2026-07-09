use axum::{extract::State, Json};
use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::{auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct AuditLogEntry {
    id: Uuid,
    action: String,
    module: String,
    user_email: Option<String>,
    created_at: DateTime<Utc>,
}

// Shows this tenant's entries plus platform-level ones (tenant_id NULL) —
// today almost everything is platform-level since there's no real
// tenant-scoped user flow yet (see tenant::resolve_tenant_id). Filtering
// strictly by tenant_id would show an empty list.
pub async fn list_audit_logs(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<AuditLogEntry>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let entries = sqlx::query_as!(
        AuditLogEntry,
        r#"
        SELECT a.id, a.action, a.module, u.email as user_email, a.created_at
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.tenant_id = $1 OR a.tenant_id IS NULL
        ORDER BY a.created_at DESC
        LIMIT 200
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(entries))
}
