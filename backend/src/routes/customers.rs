use axum::{
    extract::{Path, State},
    Json,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct CustomerResponse {
    id: Uuid,
    name: String,
    phone: Option<String>,
    email: Option<String>,
    address: Option<String>,
    customer_group: Option<String>,
    credit_limit: Decimal,
    is_active: bool,
}

pub async fn list_customers(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<CustomerResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let customers = sqlx::query_as!(
        CustomerResponse,
        r#"
        SELECT id, name, phone, email, address, customer_group, credit_limit, is_active
        FROM customers
        WHERE tenant_id = $1
        ORDER BY name
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(customers))
}

#[derive(Deserialize)]
pub struct CreateCustomerRequest {
    name: String,
    phone: Option<String>,
    email: Option<String>,
    address: Option<String>,
    customer_group: Option<String>,
    credit_limit: Option<Decimal>,
}

pub async fn create_customer(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateCustomerRequest>,
) -> Result<Json<CustomerResponse>, AppError> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation("name is required".to_string()));
    }
    let credit_limit = req.credit_limit.unwrap_or(Decimal::ZERO);
    if credit_limit < Decimal::ZERO {
        return Err(AppError::Validation("credit limit cannot be negative".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let customer = sqlx::query_as!(
        CustomerResponse,
        r#"
        INSERT INTO customers (tenant_id, name, phone, email, address, customer_group, credit_limit, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, phone, email, address, customer_group, credit_limit, is_active
        "#,
        tenant_id,
        req.name.trim(),
        req.phone.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        req.email.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        req.address.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        req.customer_group.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        credit_limit,
        auth_user.user_id
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_customer", "customers")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(customer))
}

#[derive(Deserialize)]
pub struct UpdateCustomerRequest {
    is_active: bool,
}

pub async fn update_customer(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateCustomerRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let updated = sqlx::query!(
        "UPDATE customers SET is_active = $3, updated_at = now() WHERE id = $1 AND tenant_id = $2",
        id,
        tenant_id,
        req.is_active
    )
    .execute(&state.db)
    .await?;

    if updated.rows_affected() == 0 {
        return Err(AppError::Validation("customer not found".to_string()));
    }

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "update_customer", "customers")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}
