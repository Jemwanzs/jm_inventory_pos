use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::{auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct NotificationResponse {
    id: Uuid,
    title: String,
    body: Option<String>,
    link_module: Option<String>,
    link_reference_id: Option<Uuid>,
    is_read: bool,
    created_at: DateTime<Utc>,
}

pub async fn list_notifications(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<NotificationResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let notifications = sqlx::query_as!(
        NotificationResponse,
        r#"
        SELECT id, title, body, link_module, link_reference_id, is_read, created_at
        FROM notifications
        WHERE tenant_id = $1 AND user_id = $2
        ORDER BY created_at DESC
        LIMIT 100
        "#,
        tenant_id,
        auth_user.user_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(notifications))
}

pub async fn mark_read(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!(
        "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
        id,
        auth_user.user_id
    )
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn mark_all_read(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    sqlx::query!(
        "UPDATE notifications SET is_read = TRUE WHERE tenant_id = $1 AND user_id = $2 AND NOT is_read",
        tenant_id,
        auth_user.user_id
    )
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "ok": true })))
}
