use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct SupplierResponse {
    id: Uuid,
    name: String,
    contact_person: Option<String>,
    phone: Option<String>,
    email: Option<String>,
    address: Option<String>,
    payment_terms: Option<String>,
    is_active: bool,
}

pub async fn list_suppliers(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<SupplierResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let suppliers = sqlx::query_as!(
        SupplierResponse,
        r#"
        SELECT id, name, contact_person, phone, email, address, payment_terms, is_active
        FROM suppliers
        WHERE tenant_id = $1
        ORDER BY name
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(suppliers))
}

#[derive(Deserialize)]
pub struct CreateSupplierRequest {
    name: String,
    contact_person: Option<String>,
    phone: Option<String>,
    email: Option<String>,
    address: Option<String>,
    payment_terms: Option<String>,
}

pub async fn create_supplier(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateSupplierRequest>,
) -> Result<Json<SupplierResponse>, AppError> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation("name is required".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let supplier = sqlx::query_as!(
        SupplierResponse,
        r#"
        INSERT INTO suppliers (tenant_id, name, contact_person, phone, email, address, payment_terms, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, contact_person, phone, email, address, payment_terms, is_active
        "#,
        tenant_id,
        req.name.trim(),
        req.contact_person.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        req.phone.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        req.email.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        req.address.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        req.payment_terms.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        auth_user.user_id
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_supplier", "suppliers")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(supplier))
}

#[derive(Deserialize)]
pub struct UpdateSupplierRequest {
    is_active: bool,
}

pub async fn update_supplier(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateSupplierRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let updated = sqlx::query!(
        "UPDATE suppliers SET is_active = $3, updated_at = now() WHERE id = $1 AND tenant_id = $2",
        id,
        tenant_id,
        req.is_active
    )
    .execute(&state.db)
    .await?;

    if updated.rows_affected() == 0 {
        return Err(AppError::Validation("supplier not found".to_string()));
    }

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "update_supplier", "suppliers")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}
