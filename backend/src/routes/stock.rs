use axum::{extract::State, Json};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

const MOVEMENT_TYPES: &[&str] = &["Opening Stock", "Purchase"];

#[derive(Serialize)]
pub struct StockBalanceResponse {
    id: Uuid,
    product_id: Uuid,
    product_name: String,
    product_sku: Option<String>,
    workspace_id: Uuid,
    workspace_name: String,
    quantity_available: Decimal,
    average_cost: Decimal,
}

// Every stock-changing operation follows the same rule (see
// docs/backend-architecture.md Stock Transaction Rules): a movement
// record plus a balance update, in one transaction, with the acting
// user/workspace captured and an audit entry written.
pub async fn list_balances(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<StockBalanceResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let balances = sqlx::query_as!(
        StockBalanceResponse,
        r#"
        SELECT
            sb.id, sb.product_id, p.name AS product_name, p.sku AS product_sku,
            sb.workspace_id, w.name AS workspace_name,
            sb.quantity_available, sb.average_cost
        FROM stock_balances sb
        JOIN products p ON p.id = sb.product_id
        JOIN workspaces w ON w.id = sb.workspace_id
        WHERE sb.tenant_id = $1 AND sb.quantity_available <> 0
        ORDER BY p.name, w.name
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(balances))
}

#[derive(Deserialize)]
pub struct AddStockRequest {
    workspace_id: Uuid,
    product_id: Uuid,
    movement_type: String,
    quantity: Decimal,
    unit_cost: Option<Decimal>,
    reason: Option<String>,
}

#[derive(Serialize)]
pub struct AddStockResponse {
    quantity_available: Decimal,
    average_cost: Decimal,
}

pub async fn add_stock(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<AddStockRequest>,
) -> Result<Json<AddStockResponse>, AppError> {
    if !MOVEMENT_TYPES.contains(&req.movement_type.as_str()) {
        return Err(AppError::Validation(format!("unknown movement type '{}'", req.movement_type)));
    }
    if req.quantity <= Decimal::ZERO {
        return Err(AppError::Validation("quantity must be greater than zero".to_string()));
    }
    let unit_cost = req.unit_cost.unwrap_or(Decimal::ZERO);
    if unit_cost < Decimal::ZERO {
        return Err(AppError::Validation("unit cost cannot be negative".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let mut tx = state.db.begin().await?;

    // 1. Movement ledger entry.
    sqlx::query!(
        r#"
        INSERT INTO stock_movements (
            tenant_id, workspace_id, product_id, movement_type,
            quantity_in, unit_cost, reason, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#,
        tenant_id,
        req.workspace_id,
        req.product_id,
        req.movement_type,
        req.quantity,
        unit_cost,
        req.reason.as_deref(),
        auth_user.user_id
    )
    .execute(&mut *tx)
    .await?;

    // 2. Balance update — weighted-average cost across old and new stock.
    let existing = sqlx::query!(
        r#"
        SELECT quantity_available, average_cost
        FROM stock_balances
        WHERE workspace_id = $1 AND product_id = $2
        FOR UPDATE
        "#,
        req.workspace_id,
        req.product_id
    )
    .fetch_optional(&mut *tx)
    .await?;

    let (new_quantity, new_avg_cost) = match existing {
        Some(row) => {
            let total_qty = row.quantity_available + req.quantity;
            let new_avg = if total_qty > Decimal::ZERO {
                (row.quantity_available * row.average_cost + req.quantity * unit_cost) / total_qty
            } else {
                unit_cost
            };
            (total_qty, new_avg)
        }
        None => (req.quantity, unit_cost),
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
        req.product_id,
        new_quantity,
        new_avg_cost
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // 7. Audit trail.
    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "add_stock", "inventory")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(AddStockResponse {
        quantity_available: new_quantity,
        average_cost: new_avg_cost,
    }))
}

#[derive(Serialize)]
pub struct StockMovementResponse {
    id: Uuid,
    product_name: String,
    workspace_name: String,
    movement_type: String,
    quantity_in: Decimal,
    quantity_out: Decimal,
    unit_cost: Option<Decimal>,
    reason: Option<String>,
    user_email: Option<String>,
    created_at: DateTime<Utc>,
}

pub async fn list_movements(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<StockMovementResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let movements = sqlx::query_as!(
        StockMovementResponse,
        r#"
        SELECT
            sm.id, p.name AS product_name, w.name AS workspace_name,
            sm.movement_type, sm.quantity_in, sm.quantity_out, sm.unit_cost, sm.reason,
            u.email AS "user_email?", sm.created_at
        FROM stock_movements sm
        JOIN products p ON p.id = sm.product_id
        JOIN workspaces w ON w.id = sm.workspace_id
        LEFT JOIN users u ON u.id = sm.created_by
        WHERE sm.tenant_id = $1
        ORDER BY sm.created_at DESC
        LIMIT 100
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(movements))
}
