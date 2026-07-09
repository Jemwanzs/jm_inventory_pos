use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

const VALID_MODULES: &[&str] = &["products", "customers", "suppliers", "sales", "purchases"];
const VALID_FIELD_TYPES: &[&str] = &["text", "number", "date", "dropdown", "checkbox", "file"];

#[derive(Serialize)]
pub struct CustomFieldResponse {
    id: Uuid,
    module: String,
    field_name: String,
    field_type: String,
    is_required: bool,
    is_active: bool,
}

pub async fn list_custom_fields(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<CustomFieldResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let fields = sqlx::query_as!(
        CustomFieldResponse,
        r#"
        SELECT id, module, field_name, field_type, is_required, is_active
        FROM custom_fields
        WHERE tenant_id = $1
        ORDER BY module, field_name
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(fields))
}

#[derive(Deserialize)]
pub struct CreateCustomFieldRequest {
    module: String,
    field_name: String,
    field_type: String,
    is_required: bool,
}

pub async fn create_custom_field(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateCustomFieldRequest>,
) -> Result<Json<CustomFieldResponse>, AppError> {
    if req.field_name.trim().is_empty() {
        return Err(AppError::Validation("field name is required".to_string()));
    }
    if !VALID_MODULES.contains(&req.module.as_str()) {
        return Err(AppError::Validation(format!("unknown module '{}'", req.module)));
    }
    if !VALID_FIELD_TYPES.contains(&req.field_type.as_str()) {
        return Err(AppError::Validation(format!("unknown field type '{}'", req.field_type)));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let field = sqlx::query_as!(
        CustomFieldResponse,
        r#"
        INSERT INTO custom_fields (tenant_id, module, field_name, field_type, is_required, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, module, field_name, field_type, is_required, is_active
        "#,
        tenant_id,
        req.module,
        req.field_name.trim(),
        req.field_type,
        req.is_required,
        auth_user.user_id
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(
        &state.db,
        Some(tenant_id),
        Some(auth_user.user_id),
        "create_custom_field",
        "settings.custom_fields",
    )
    .await
    .map_err(AppError::Internal)?;

    Ok(Json(field))
}

#[derive(Deserialize)]
pub struct UpdateCustomFieldRequest {
    is_active: bool,
}

pub async fn update_custom_field(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateCustomFieldRequest>,
) -> Result<Json<CustomFieldResponse>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let field = sqlx::query_as!(
        CustomFieldResponse,
        r#"
        UPDATE custom_fields
        SET is_active = $3
        WHERE id = $1 AND tenant_id = $2
        RETURNING id, module, field_name, field_type, is_required, is_active
        "#,
        id,
        tenant_id,
        req.is_active
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Validation("custom field not found".to_string()))?;

    audit::record(
        &state.db,
        Some(tenant_id),
        Some(auth_user.user_id),
        "update_custom_field",
        "settings.custom_fields",
    )
    .await
    .map_err(AppError::Internal)?;

    Ok(Json(field))
}
