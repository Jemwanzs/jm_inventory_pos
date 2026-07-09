use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("invalid credentials")]
    InvalidCredentials,

    #[error("unauthorized")]
    Unauthorized,

    #[error("{0}")]
    Validation(String),

    #[error(transparent)]
    Database(#[from] sqlx::Error),

    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::InvalidCredentials => (StatusCode::UNAUTHORIZED, self.to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, self.to_string()),
            AppError::Validation(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::Database(err) => {
                // Postgres 23505 = unique_violation. Surfacing this as a
                // plain validation message covers every insert endpoint's
                // UNIQUE constraint (products, categories, brands, units,
                // workspaces, roles, ...) without each handler needing its
                // own pre-check-then-insert dance.
                if let sqlx::Error::Database(db_err) = err {
                    if db_err.code().as_deref() == Some("23505") {
                        (
                            StatusCode::CONFLICT,
                            "That name or code is already in use.".to_string(),
                        )
                    } else {
                        tracing::error!(?db_err, "database error");
                        (StatusCode::INTERNAL_SERVER_ERROR, "internal server error".to_string())
                    }
                } else {
                    tracing::error!(?err, "database error");
                    (StatusCode::INTERNAL_SERVER_ERROR, "internal server error".to_string())
                }
            }
            AppError::Internal(err) => {
                tracing::error!(?err, "internal error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal server error".to_string(),
                )
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}
