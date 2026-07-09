use axum::{
    extract::{Path, State},
    Json,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct ProductResponse {
    id: Uuid,
    name: String,
    sku: Option<String>,
    barcode: Option<String>,
    category_name: Option<String>,
    brand_name: Option<String>,
    unit_abbreviation: Option<String>,
    cost_price: Decimal,
    selling_price: Decimal,
    is_active: bool,
}

pub async fn list_products(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<ProductResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let products = sqlx::query_as!(
        ProductResponse,
        r#"
        SELECT
            p.id, p.name, p.sku, p.barcode,
            c.name AS "category_name?",
            b.name AS "brand_name?",
            u.abbreviation AS "unit_abbreviation?",
            p.cost_price, p.selling_price, p.is_active
        FROM products p
        LEFT JOIN product_categories c ON c.id = p.category_id
        LEFT JOIN product_brands b ON b.id = p.brand_id
        LEFT JOIN units_of_measure u ON u.id = p.unit_id
        WHERE p.tenant_id = $1
        ORDER BY p.name
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(products))
}

#[derive(Deserialize)]
pub struct CreateProductRequest {
    name: String,
    sku: Option<String>,
    barcode: Option<String>,
    category_id: Option<Uuid>,
    brand_id: Option<Uuid>,
    unit_id: Option<Uuid>,
    description: Option<String>,
    cost_price: Decimal,
    selling_price: Decimal,
}

pub async fn create_product(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateProductRequest>,
) -> Result<Json<ProductResponse>, AppError> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation("name is required".to_string()));
    }
    if req.cost_price < Decimal::ZERO || req.selling_price < Decimal::ZERO {
        return Err(AppError::Validation("prices cannot be negative".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;
    let sku = req.sku.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let barcode = req.barcode.as_deref().map(str::trim).filter(|s| !s.is_empty());

    let inserted_id = sqlx::query_scalar!(
        r#"
        INSERT INTO products (
            tenant_id, name, sku, barcode, category_id, brand_id, unit_id,
            description, cost_price, selling_price, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
        "#,
        tenant_id,
        req.name.trim(),
        sku,
        barcode,
        req.category_id,
        req.brand_id,
        req.unit_id,
        req.description.as_deref(),
        req.cost_price,
        req.selling_price,
        auth_user.user_id
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_product", "products")
        .await
        .map_err(AppError::Internal)?;

    let product = sqlx::query_as!(
        ProductResponse,
        r#"
        SELECT
            p.id, p.name, p.sku, p.barcode,
            c.name AS "category_name?",
            b.name AS "brand_name?",
            u.abbreviation AS "unit_abbreviation?",
            p.cost_price, p.selling_price, p.is_active
        FROM products p
        LEFT JOIN product_categories c ON c.id = p.category_id
        LEFT JOIN product_brands b ON b.id = p.brand_id
        LEFT JOIN units_of_measure u ON u.id = p.unit_id
        WHERE p.id = $1
        "#,
        inserted_id
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(product))
}

#[derive(Deserialize)]
pub struct UpdateProductRequest {
    is_active: bool,
}

pub async fn update_product(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateProductRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let updated = sqlx::query!(
        "UPDATE products SET is_active = $3, updated_at = now() WHERE id = $1 AND tenant_id = $2",
        id,
        tenant_id,
        req.is_active
    )
    .execute(&state.db)
    .await?;

    if updated.rows_affected() == 0 {
        return Err(AppError::Validation("product not found".to_string()));
    }

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "update_product", "products")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}
