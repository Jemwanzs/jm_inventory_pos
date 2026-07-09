use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct WorkspaceResponse {
    id: Uuid,
    name: String,
    r#type: String,
    is_active: bool,
}

pub async fn list_workspaces(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<WorkspaceResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let workspaces = sqlx::query_as!(
        WorkspaceResponse,
        r#"
        SELECT id, name, type as "type", is_active
        FROM workspaces
        WHERE tenant_id = $1
        ORDER BY created_at
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(workspaces))
}

#[derive(Deserialize)]
pub struct CreateWorkspaceRequest {
    name: String,
    r#type: String,
}

pub async fn create_workspace(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateWorkspaceRequest>,
) -> Result<Json<WorkspaceResponse>, AppError> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation("name is required".to_string()));
    }
    if req.r#type.trim().is_empty() {
        return Err(AppError::Validation("type is required".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let workspace = sqlx::query_as!(
        WorkspaceResponse,
        r#"
        INSERT INTO workspaces (tenant_id, name, type, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, type as "type", is_active
        "#,
        tenant_id,
        req.name.trim(),
        req.r#type.trim(),
        auth_user.user_id
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(
        &state.db,
        Some(tenant_id),
        Some(auth_user.user_id),
        "create_workspace",
        "settings.workspaces",
    )
    .await
    .map_err(AppError::Internal)?;

    Ok(Json(workspace))
}

#[derive(Deserialize)]
pub struct UpdateWorkspaceRequest {
    name: Option<String>,
    r#type: Option<String>,
    is_active: Option<bool>,
}

pub async fn update_workspace(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateWorkspaceRequest>,
) -> Result<Json<WorkspaceResponse>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let workspace = sqlx::query_as!(
        WorkspaceResponse,
        r#"
        UPDATE workspaces
        SET
            name = COALESCE($3, name),
            type = COALESCE($4, type),
            is_active = COALESCE($5, is_active),
            updated_at = now()
        WHERE id = $1 AND tenant_id = $2
        RETURNING id, name, type as "type", is_active
        "#,
        id,
        tenant_id,
        req.name.as_deref(),
        req.r#type.as_deref(),
        req.is_active
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Validation("workspace not found".to_string()))?;

    audit::record(
        &state.db,
        Some(tenant_id),
        Some(auth_user.user_id),
        "update_workspace",
        "settings.workspaces",
    )
    .await
    .map_err(AppError::Internal)?;

    Ok(Json(workspace))
}
