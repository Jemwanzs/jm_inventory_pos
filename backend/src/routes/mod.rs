mod auth;
mod health;
mod invites;

use axum::{
    routing::{get, post},
    Router,
};

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/health", get(health::health))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/change-password", post(auth::change_password))
        .route("/api/invites", post(invites::create_invite))
        .route("/api/invites/{token}", get(invites::get_invite))
        .route("/api/invites/{token}/accept", post(invites::accept_invite))
}
