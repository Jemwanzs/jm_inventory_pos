// Categories, brands, and units of measure — three small reference-data
// lookup tables with near-identical shape. Kept as separate compile-time
// checked queries per table (rather than one generic function) since
// sqlx's query! macros need a literal table name to type-check against;
// three similar functions beat a dynamic-SQL abstraction here.
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct CategoryResponse {
    id: Uuid,
    name: String,
    is_active: bool,
}

pub async fn list_categories(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<CategoryResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;
    let rows = sqlx::query_as!(
        CategoryResponse,
        "SELECT id, name, is_active FROM product_categories WHERE tenant_id = $1 ORDER BY name",
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;
    Ok(Json(rows))
}

#[derive(Deserialize)]
pub struct NameRequest {
    name: String,
}

pub async fn create_category(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<NameRequest>,
) -> Result<Json<CategoryResponse>, AppError> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation("name is required".to_string()));
    }
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;
    let row = sqlx::query_as!(
        CategoryResponse,
        "INSERT INTO product_categories (tenant_id, name) VALUES ($1, $2) RETURNING id, name, is_active",
        tenant_id,
        req.name.trim()
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_category", "products")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(row))
}

#[derive(Serialize)]
pub struct BrandResponse {
    id: Uuid,
    name: String,
    is_active: bool,
}

pub async fn list_brands(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<BrandResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;
    let rows = sqlx::query_as!(
        BrandResponse,
        "SELECT id, name, is_active FROM product_brands WHERE tenant_id = $1 ORDER BY name",
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;
    Ok(Json(rows))
}

pub async fn create_brand(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<NameRequest>,
) -> Result<Json<BrandResponse>, AppError> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation("name is required".to_string()));
    }
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;
    let row = sqlx::query_as!(
        BrandResponse,
        "INSERT INTO product_brands (tenant_id, name) VALUES ($1, $2) RETURNING id, name, is_active",
        tenant_id,
        req.name.trim()
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_brand", "products")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(row))
}

#[derive(Serialize)]
pub struct UnitResponse {
    id: Uuid,
    name: String,
    abbreviation: String,
    is_active: bool,
}

pub async fn list_units(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<UnitResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;
    let rows = sqlx::query_as!(
        UnitResponse,
        "SELECT id, name, abbreviation, is_active FROM units_of_measure WHERE tenant_id = $1 ORDER BY name",
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;
    Ok(Json(rows))
}

#[derive(Deserialize)]
pub struct CreateUnitRequest {
    name: String,
    abbreviation: String,
}

pub async fn create_unit(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateUnitRequest>,
) -> Result<Json<UnitResponse>, AppError> {
    if req.name.trim().is_empty() || req.abbreviation.trim().is_empty() {
        return Err(AppError::Validation("name and abbreviation are required".to_string()));
    }
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;
    let row = sqlx::query_as!(
        UnitResponse,
        r#"
        INSERT INTO units_of_measure (tenant_id, name, abbreviation)
        VALUES ($1, $2, $3)
        RETURNING id, name, abbreviation, is_active
        "#,
        tenant_id,
        req.name.trim(),
        req.abbreviation.trim()
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_unit", "products")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(row))
}
