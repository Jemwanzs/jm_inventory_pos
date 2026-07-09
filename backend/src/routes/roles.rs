use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct RoleResponse {
    id: Uuid,
    name: String,
    description: Option<String>,
}

#[derive(Serialize)]
pub struct PermissionResponse {
    id: Uuid,
    code: String,
    description: Option<String>,
}

#[derive(Serialize)]
pub struct RoleAssignment {
    role_id: Uuid,
    permission_id: Uuid,
}

#[derive(Serialize)]
pub struct RolesMatrixResponse {
    roles: Vec<RoleResponse>,
    permissions: Vec<PermissionResponse>,
    assignments: Vec<RoleAssignment>,
}

// Tenant-scoped roles only — the platform-level `super_admin` role
// (tenant_id NULL) is intentionally excluded, it isn't something a tenant
// admin should be able to reassign permissions on from here.
pub async fn get_roles_matrix(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<RolesMatrixResponse>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let roles = sqlx::query_as!(
        RoleResponse,
        "SELECT id, name, description FROM roles WHERE tenant_id = $1 ORDER BY name",
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    let permissions = sqlx::query_as!(
        PermissionResponse,
        "SELECT id, code, description FROM permissions ORDER BY code"
    )
    .fetch_all(&state.db)
    .await?;

    let assignments = sqlx::query_as!(
        RoleAssignment,
        r#"
        SELECT rp.role_id, rp.permission_id
        FROM role_permissions rp
        JOIN roles r ON r.id = rp.role_id
        WHERE r.tenant_id = $1
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(RolesMatrixResponse { roles, permissions, assignments }))
}

#[derive(Deserialize)]
pub struct UpdateRolePermissionsRequest {
    permission_ids: Vec<Uuid>,
}

// Full-replace semantics: the request body is the complete set of
// permissions the role should have afterward, not a delta.
pub async fn update_role_permissions(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(role_id): Path<Uuid>,
    Json(req): Json<UpdateRolePermissionsRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let owned = sqlx::query_scalar!(
        r#"SELECT COUNT(*) as "count!" FROM roles WHERE id = $1 AND tenant_id = $2"#,
        role_id,
        tenant_id
    )
    .fetch_one(&state.db)
    .await?;
    if owned == 0 {
        return Err(AppError::Validation("role not found".to_string()));
    }

    let mut tx = state.db.begin().await?;

    sqlx::query!("DELETE FROM role_permissions WHERE role_id = $1", role_id)
        .execute(&mut *tx)
        .await?;

    for permission_id in &req.permission_ids {
        sqlx::query!(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
            role_id,
            permission_id
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    audit::record(
        &state.db,
        Some(tenant_id),
        Some(auth_user.user_id),
        "update_role_permissions",
        "settings.roles",
    )
    .await
    .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}
