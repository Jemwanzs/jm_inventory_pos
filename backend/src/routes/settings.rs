use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::Value;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

const VALID_CATEGORIES: &[&str] = &[
    "business",
    "inventory",
    "pos",
    "tax",
    "notifications",
    "security",
    "approval",
    "templates",
];

fn validate_category(category: &str) -> Result<(), AppError> {
    if VALID_CATEGORIES.contains(&category) {
        Ok(())
    } else {
        Err(AppError::Validation(format!("unknown settings category '{category}'")))
    }
}

pub async fn get_settings(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(category): Path<String>,
) -> Result<Json<Value>, AppError> {
    validate_category(&category)?;
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let data = sqlx::query_scalar!(
        "SELECT data FROM tenant_settings WHERE tenant_id = $1 AND category = $2",
        tenant_id,
        category
    )
    .fetch_optional(&state.db)
    .await?;

    Ok(Json(data.unwrap_or_else(|| serde_json::json!({}))))
}

pub async fn put_settings(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(category): Path<String>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, AppError> {
    validate_category(&category)?;
    if !body.is_object() {
        return Err(AppError::Validation("settings payload must be a JSON object".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    sqlx::query!(
        r#"
        INSERT INTO tenant_settings (tenant_id, category, data, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, now())
        ON CONFLICT (tenant_id, category)
        DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = now()
        "#,
        tenant_id,
        category,
        body,
        auth_user.user_id
    )
    .execute(&state.db)
    .await?;

    audit::record(
        &state.db,
        Some(tenant_id),
        Some(auth_user.user_id),
        "update_settings",
        &format!("settings.{category}"),
    )
    .await
    .map_err(AppError::Internal)?;

    Ok(Json(body))
}
