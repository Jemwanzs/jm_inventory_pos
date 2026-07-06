use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    audit,
    auth::{extractor::AuthUser, jwt, password},
    error::AppError,
    state::AppState,
};

#[derive(Deserialize)]
pub struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    token: String,
    must_change_password: bool,
}

struct UserRow {
    id: Uuid,
    tenant_id: Option<Uuid>,
    password_hash: String,
    must_change_password: bool,
    is_active: bool,
}

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let user = sqlx::query_as!(
        UserRow,
        r#"
        SELECT id, tenant_id, password_hash, must_change_password, is_active
        FROM users
        WHERE email = $1 AND deleted_at IS NULL
        "#,
        req.email
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::InvalidCredentials)?;

    if !user.is_active {
        return Err(AppError::InvalidCredentials);
    }

    if !password::verify_password(&req.password, &user.password_hash)? {
        return Err(AppError::InvalidCredentials);
    }

    let token = jwt::issue_token(
        user.id,
        user.tenant_id,
        user.must_change_password,
        &state.config.jwt_secret,
    )?;

    audit::record(&state.db, user.tenant_id, Some(user.id), "login", "auth")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(LoginResponse {
        token,
        must_change_password: user.must_change_password,
    }))
}

#[derive(Deserialize)]
pub struct ChangePasswordRequest {
    current_password: String,
    new_password: String,
}

#[derive(Serialize)]
pub struct ChangePasswordResponse {
    token: String,
}

pub async fn change_password(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<ChangePasswordRequest>,
) -> Result<Json<ChangePasswordResponse>, AppError> {
    if req.new_password.len() < 8 {
        return Err(AppError::Validation(
            "new password must be at least 8 characters".to_string(),
        ));
    }

    let current_hash: String =
        sqlx::query_scalar!("SELECT password_hash FROM users WHERE id = $1", auth_user.user_id)
            .fetch_one(&state.db)
            .await?;

    if !password::verify_password(&req.current_password, &current_hash)? {
        return Err(AppError::InvalidCredentials);
    }

    let new_hash = password::hash_password(&req.new_password)?;

    sqlx::query!(
        r#"
        UPDATE users
        SET password_hash = $1, must_change_password = FALSE, updated_at = now(), updated_by = $2
        WHERE id = $2
        "#,
        new_hash,
        auth_user.user_id
    )
    .execute(&state.db)
    .await?;

    audit::record(
        &state.db,
        auth_user.tenant_id,
        Some(auth_user.user_id),
        "change_password",
        "auth",
    )
    .await
    .map_err(AppError::Internal)?;

    let token = jwt::issue_token(
        auth_user.user_id,
        auth_user.tenant_id,
        false,
        &state.config.jwt_secret,
    )?;

    Ok(Json(ChangePasswordResponse { token }))
}
