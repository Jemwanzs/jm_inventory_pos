mod audit_logs;
mod auth;
mod custom_fields;
mod health;
mod invites;
mod numbering;
mod roles;
mod settings;
mod workspaces;

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
        .route(
            "/api/settings/numbering",
            get(numbering::list_numbering),
        )
        .route(
            "/api/settings/numbering/{document_type}",
            axum::routing::put(numbering::update_numbering),
        )
        .route(
            "/api/settings/{category}",
            get(settings::get_settings).put(settings::put_settings),
        )
        .route(
            "/api/workspaces",
            get(workspaces::list_workspaces).post(workspaces::create_workspace),
        )
        .route(
            "/api/workspaces/{id}",
            axum::routing::patch(workspaces::update_workspace),
        )
        .route("/api/audit-logs", get(audit_logs::list_audit_logs))
        .route(
            "/api/custom-fields",
            get(custom_fields::list_custom_fields).post(custom_fields::create_custom_field),
        )
        .route(
            "/api/custom-fields/{id}",
            axum::routing::patch(custom_fields::update_custom_field),
        )
        .route("/api/roles-matrix", get(roles::get_roles_matrix))
        .route(
            "/api/roles/{role_id}/permissions",
            axum::routing::put(roles::update_role_permissions),
        )
}
