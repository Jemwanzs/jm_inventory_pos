use axum::{extract::State, Json};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct RecipeResponse {
    id: Uuid,
    name: String,
    product_name: String,
    ingredient_count: i64,
    is_active: bool,
}

pub async fn list_recipes(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<RecipeResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let recipes = sqlx::query_as!(
        RecipeResponse,
        r#"
        SELECT
            r.id, r.name, p.name AS product_name,
            COALESCE(i.ingredient_count, 0) AS "ingredient_count!",
            r.is_active
        FROM recipes r
        JOIN products p ON p.id = r.product_id
        LEFT JOIN (
            SELECT recipe_id, COUNT(*) AS ingredient_count FROM recipe_ingredients GROUP BY recipe_id
        ) i ON i.recipe_id = r.id
        WHERE r.tenant_id = $1
        ORDER BY r.name
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(recipes))
}

#[derive(Deserialize)]
pub struct IngredientRequest {
    product_id: Uuid,
    quantity_per_unit: Decimal,
}

#[derive(Deserialize)]
pub struct CreateRecipeRequest {
    product_id: Uuid,
    name: String,
    ingredients: Vec<IngredientRequest>,
}

pub async fn create_recipe(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateRecipeRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation("name is required".to_string()));
    }
    if req.ingredients.is_empty() {
        return Err(AppError::Validation("a recipe needs at least one ingredient".to_string()));
    }
    for ingredient in &req.ingredients {
        if ingredient.quantity_per_unit <= Decimal::ZERO {
            return Err(AppError::Validation("ingredient quantity must be greater than zero".to_string()));
        }
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let mut tx = state.db.begin().await?;

    let recipe_id = sqlx::query_scalar!(
        r#"
        INSERT INTO recipes (tenant_id, product_id, name, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        "#,
        tenant_id,
        req.product_id,
        req.name.trim(),
        auth_user.user_id
    )
    .fetch_one(&mut *tx)
    .await?;

    for ingredient in &req.ingredients {
        sqlx::query!(
            r#"
            INSERT INTO recipe_ingredients (recipe_id, product_id, quantity_per_unit)
            VALUES ($1, $2, $3)
            "#,
            recipe_id,
            ingredient.product_id,
            ingredient.quantity_per_unit
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_recipe", "production")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "id": recipe_id })))
}

#[derive(Serialize)]
pub struct ProductionOrderResponse {
    id: Uuid,
    recipe_name: String,
    workspace_name: String,
    quantity_produced: Decimal,
    unit_cost: Decimal,
    created_at: DateTime<Utc>,
}

pub async fn list_orders(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<ProductionOrderResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let orders = sqlx::query_as!(
        ProductionOrderResponse,
        r#"
        SELECT po.id, r.name AS recipe_name, w.name AS workspace_name, po.quantity_produced, po.unit_cost, po.created_at
        FROM production_orders po
        JOIN recipes r ON r.id = po.recipe_id
        JOIN workspaces w ON w.id = po.workspace_id
        WHERE po.tenant_id = $1
        ORDER BY po.created_at DESC
        LIMIT 100
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(orders))
}

#[derive(Deserialize)]
pub struct CreateProductionOrderRequest {
    recipe_id: Uuid,
    workspace_id: Uuid,
    quantity_produced: Decimal,
}

// A production order is the Production module's integration point with
// Inventory: raw-material ingredients are deducted (Production
// Consumption) and the finished good is added (Production Output) in one
// transaction, with the finished good's unit cost derived from the actual
// cost of the ingredients consumed — not a guess.
pub async fn create_order(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateProductionOrderRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.quantity_produced <= Decimal::ZERO {
        return Err(AppError::Validation("quantity produced must be greater than zero".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let mut tx = state.db.begin().await?;

    let recipe = sqlx::query!(
        r#"SELECT product_id FROM recipes WHERE id = $1 AND tenant_id = $2"#,
        req.recipe_id,
        tenant_id
    )
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::Validation("recipe not found".to_string()))?;

    let ingredients = sqlx::query!(
        r#"
        SELECT ri.product_id, ri.quantity_per_unit, p.name AS product_name
        FROM recipe_ingredients ri
        JOIN products p ON p.id = ri.product_id
        WHERE ri.recipe_id = $1
        "#,
        req.recipe_id
    )
    .fetch_all(&mut *tx)
    .await?;

    let mut total_ingredient_cost = Decimal::ZERO;

    for ingredient in &ingredients {
        let needed = ingredient.quantity_per_unit * req.quantity_produced;

        let balance = sqlx::query!(
            r#"
            SELECT quantity_available, average_cost
            FROM stock_balances
            WHERE workspace_id = $1 AND product_id = $2
            FOR UPDATE
            "#,
            req.workspace_id,
            ingredient.product_id
        )
        .fetch_optional(&mut *tx)
        .await?
        .ok_or_else(|| AppError::Validation(format!("insufficient stock for {}", ingredient.product_name)))?;

        if balance.quantity_available < needed {
            return Err(AppError::Validation(format!(
                "insufficient stock for {}: {} available, {} needed",
                ingredient.product_name, balance.quantity_available, needed
            )));
        }

        total_ingredient_cost += needed * balance.average_cost;

        sqlx::query!(
            r#"
            INSERT INTO stock_movements (
                tenant_id, workspace_id, product_id, movement_type,
                quantity_out, unit_cost, reason, created_by
            )
            VALUES ($1, $2, $3, 'Production Consumption', $4, $5, $6, $7)
            "#,
            tenant_id,
            req.workspace_id,
            ingredient.product_id,
            needed,
            balance.average_cost,
            format!("Production order for recipe {}", req.recipe_id),
            auth_user.user_id
        )
        .execute(&mut *tx)
        .await?;

        sqlx::query!(
            r#"
            UPDATE stock_balances
            SET quantity_available = quantity_available - $3, updated_at = now()
            WHERE workspace_id = $1 AND product_id = $2
            "#,
            req.workspace_id,
            ingredient.product_id,
            needed
        )
        .execute(&mut *tx)
        .await?;
    }

    let unit_cost = if req.quantity_produced > Decimal::ZERO {
        total_ingredient_cost / req.quantity_produced
    } else {
        Decimal::ZERO
    };

    sqlx::query!(
        r#"
        INSERT INTO stock_movements (
            tenant_id, workspace_id, product_id, movement_type,
            quantity_in, unit_cost, reason, created_by
        )
        VALUES ($1, $2, $3, 'Production Output', $4, $5, $6, $7)
        "#,
        tenant_id,
        req.workspace_id,
        recipe.product_id,
        req.quantity_produced,
        unit_cost,
        format!("Production order for recipe {}", req.recipe_id),
        auth_user.user_id
    )
    .execute(&mut *tx)
    .await?;

    let existing_finished = sqlx::query!(
        r#"
        SELECT quantity_available, average_cost
        FROM stock_balances
        WHERE workspace_id = $1 AND product_id = $2
        FOR UPDATE
        "#,
        req.workspace_id,
        recipe.product_id
    )
    .fetch_optional(&mut *tx)
    .await?;

    let (new_quantity, new_avg_cost) = match existing_finished {
        Some(row) => {
            let total_qty = row.quantity_available + req.quantity_produced;
            let new_avg = if total_qty > Decimal::ZERO {
                (row.quantity_available * row.average_cost + req.quantity_produced * unit_cost) / total_qty
            } else {
                unit_cost
            };
            (total_qty, new_avg)
        }
        None => (req.quantity_produced, unit_cost),
    };

    sqlx::query!(
        r#"
        INSERT INTO stock_balances (tenant_id, workspace_id, product_id, quantity_available, average_cost, updated_at)
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT (workspace_id, product_id)
        DO UPDATE SET quantity_available = $4, average_cost = $5, updated_at = now()
        "#,
        tenant_id,
        req.workspace_id,
        recipe.product_id,
        new_quantity,
        new_avg_cost
    )
    .execute(&mut *tx)
    .await?;

    let order_id = sqlx::query_scalar!(
        r#"
        INSERT INTO production_orders (tenant_id, recipe_id, workspace_id, quantity_produced, unit_cost, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        "#,
        tenant_id,
        req.recipe_id,
        req.workspace_id,
        req.quantity_produced,
        unit_cost,
        auth_user.user_id
    )
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_production_order", "production")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "id": order_id, "unit_cost": unit_cost })))
}
