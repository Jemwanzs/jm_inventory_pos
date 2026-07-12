use axum::{extract::State, Json};
use serde::Serialize;
use uuid::Uuid;

use crate::{auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct UserResponse {
    id: Uuid,
    email: String,
    full_name: String,
}

pub async fn list_users(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let users = sqlx::query_as!(
        UserResponse,
        r#"
        SELECT id, email, full_name
        FROM users
        WHERE (tenant_id = $1 OR tenant_id IS NULL) AND is_active AND deleted_at IS NULL
        ORDER BY full_name
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(users))
}
