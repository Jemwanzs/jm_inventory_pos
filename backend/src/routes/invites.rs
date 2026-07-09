use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    audit,
    auth::{extractor::AuthUser, jwt, password, token},
    error::AppError,
    state::AppState,
};

#[derive(Deserialize)]
pub struct CreateInviteRequest {
    email: String,
}

#[derive(Serialize)]
pub struct CreateInviteResponse {
    invite_link: String,
}

// Gated to platform-level (tenant_id IS NULL) users for now — there's no
// tenant-admin-invites-into-their-own-tenant flow built yet, and pretending
// otherwise here would be dishonest about what's actually enforced.
pub async fn create_invite(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateInviteRequest>,
) -> Result<Json<CreateInviteResponse>, AppError> {
    if auth_user.tenant_id.is_some() {
        return Err(AppError::Unauthorized);
    }

    let email = req.email.trim().to_lowercase();
    if email.is_empty() || !email.contains('@') {
        return Err(AppError::Validation("a valid email is required".to_string()));
    }

    let existing_count = sqlx::query_scalar!(
        r#"SELECT COUNT(*) as "count!" FROM users WHERE email = $1"#,
        email
    )
    .fetch_one(&state.db)
    .await?;

    if existing_count > 0 {
        return Err(AppError::Validation(
            "a user with that email already exists".to_string(),
        ));
    }

    let raw_token = token::generate_invite_token();
    let token_hash = token::hash_token(&raw_token);
    let expires_at = Utc::now() + Duration::days(7);

    sqlx::query!(
        r#"
        INSERT INTO invites (tenant_id, email, token_hash, invited_by, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        "#,
        auth_user.tenant_id,
        email,
        token_hash,
        auth_user.user_id,
        expires_at
    )
    .execute(&state.db)
    .await?;

    audit::record(
        &state.db,
        auth_user.tenant_id,
        Some(auth_user.user_id),
        "invite_user",
        "auth",
    )
    .await
    .map_err(AppError::Internal)?;

    let invite_link = format!("{}/?token={}", state.config.app_base_url, raw_token);

    let html = format!(
        "<p>You've been invited to Inventory + POS.</p>\
         <p><a href=\"{invite_link}\">Click here to set up your account</a></p>\
         <p>This link expires in 7 days.</p>"
    );
    if let Err(err) = state
        .email
        .send(&email, "You're invited to Inventory + POS", &html)
        .await
    {
        tracing::error!(?err, "failed to send invite email");
    }

    Ok(Json(CreateInviteResponse { invite_link }))
}

#[derive(Serialize)]
pub struct InviteInfoResponse {
    email: String,
}

pub async fn get_invite(
    State(state): State<AppState>,
    Path(raw_token): Path<String>,
) -> Result<Json<InviteInfoResponse>, AppError> {
    let token_hash = token::hash_token(&raw_token);

    let invite = sqlx::query!(
        r#"SELECT email, accepted_at, expires_at FROM invites WHERE token_hash = $1"#,
        token_hash
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Validation("invite not found or already used".to_string()))?;

    if invite.accepted_at.is_some() {
        return Err(AppError::Validation("this invite has already been used".to_string()));
    }
    if invite.expires_at < Utc::now() {
        return Err(AppError::Validation("this invite has expired".to_string()));
    }

    Ok(Json(InviteInfoResponse { email: invite.email }))
}

#[derive(Deserialize)]
pub struct AcceptInviteRequest {
    name: String,
    password: String,
}

#[derive(Serialize)]
pub struct AcceptInviteResponse {
    token: String,
    must_change_password: bool,
}

pub async fn accept_invite(
    State(state): State<AppState>,
    Path(raw_token): Path<String>,
    Json(req): Json<AcceptInviteRequest>,
) -> Result<Json<AcceptInviteResponse>, AppError> {
    let name = req.name.trim();
    if name.is_empty() {
        return Err(AppError::Validation("name is required".to_string()));
    }
    if req.password.len() < 8 {
        return Err(AppError::Validation(
            "password must be at least 8 characters".to_string(),
        ));
    }

    let token_hash = token::hash_token(&raw_token);

    let invite = sqlx::query!(
        r#"SELECT id, tenant_id, email, accepted_at, expires_at FROM invites WHERE token_hash = $1"#,
        token_hash
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Validation("invite not found or already used".to_string()))?;

    if invite.accepted_at.is_some() {
        return Err(AppError::Validation("this invite has already been used".to_string()));
    }
    if invite.expires_at < Utc::now() {
        return Err(AppError::Validation("this invite has expired".to_string()));
    }

    let password_hash = password::hash_password(&req.password)?;

    let mut tx = state.db.begin().await?;

    let user_id: Uuid = sqlx::query_scalar!(
        r#"
        INSERT INTO users (tenant_id, email, full_name, password_hash, must_change_password, is_active)
        VALUES ($1, $2, $3, $4, FALSE, TRUE)
        RETURNING id
        "#,
        invite.tenant_id,
        invite.email,
        name,
        password_hash
    )
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query!("UPDATE invites SET accepted_at = now() WHERE id = $1", invite.id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    audit::record(&state.db, invite.tenant_id, Some(user_id), "accept_invite", "auth")
        .await
        .map_err(AppError::Internal)?;

    let jwt_token = jwt::issue_token(user_id, invite.tenant_id, false, &state.config.jwt_secret)?;

    Ok(Json(AcceptInviteResponse {
        token: jwt_token,
        must_change_password: false,
    }))
}
