use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct PurchaseOrderResponse {
    id: Uuid,
    supplier_name: String,
    workspace_name: String,
    status: String,
    item_count: i64,
    total_value: Decimal,
    notes: Option<String>,
    created_at: DateTime<Utc>,
    received_at: Option<DateTime<Utc>>,
}

pub async fn list_orders(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<PurchaseOrderResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let orders = sqlx::query_as!(
        PurchaseOrderResponse,
        r#"
        SELECT
            po.id, s.name AS supplier_name, w.name AS workspace_name, po.status,
            COALESCE(i.item_count, 0) AS "item_count!",
            COALESCE(i.total_value, 0) AS "total_value!",
            po.notes, po.created_at, po.received_at
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        JOIN workspaces w ON w.id = po.workspace_id
        LEFT JOIN (
            SELECT purchase_order_id, COUNT(*) AS item_count, SUM(quantity * unit_cost) AS total_value
            FROM purchase_order_items
            GROUP BY purchase_order_id
        ) i ON i.purchase_order_id = po.id
        WHERE po.tenant_id = $1
        ORDER BY po.created_at DESC
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(orders))
}

#[derive(Deserialize)]
pub struct OrderItemRequest {
    product_id: Uuid,
    quantity: Decimal,
    unit_cost: Decimal,
}

#[derive(Deserialize)]
pub struct CreateOrderRequest {
    supplier_id: Uuid,
    workspace_id: Uuid,
    notes: Option<String>,
    items: Vec<OrderItemRequest>,
}

pub async fn create_order(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateOrderRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.items.is_empty() {
        return Err(AppError::Validation("a purchase order needs at least one line item".to_string()));
    }
    for item in &req.items {
        if item.quantity <= Decimal::ZERO {
            return Err(AppError::Validation("line item quantity must be greater than zero".to_string()));
        }
        if item.unit_cost < Decimal::ZERO {
            return Err(AppError::Validation("line item cost cannot be negative".to_string()));
        }
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let mut tx = state.db.begin().await?;

    let order_id = sqlx::query_scalar!(
        r#"
        INSERT INTO purchase_orders (tenant_id, supplier_id, workspace_id, notes, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        "#,
        tenant_id,
        req.supplier_id,
        req.workspace_id,
        req.notes.as_deref(),
        auth_user.user_id
    )
    .fetch_one(&mut *tx)
    .await?;

    for item in &req.items {
        sqlx::query!(
            r#"
            INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
            VALUES ($1, $2, $3, $4)
            "#,
            order_id,
            item.product_id,
            item.quantity,
            item.unit_cost
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_purchase_order", "procurement")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "id": order_id })))
}

// Receiving a PO is where Procurement meets Inventory: every line item
// becomes a stock_movements entry plus a stock_balances update, using the
// same weighted-average-cost transaction rule as Inventory > Add Stock
// (see docs/backend-architecture.md Stock Transaction Rules).
pub async fn receive_order(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let mut tx = state.db.begin().await?;

    let order = sqlx::query!(
        r#"SELECT workspace_id, status FROM purchase_orders WHERE id = $1 AND tenant_id = $2 FOR UPDATE"#,
        id,
        tenant_id
    )
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::Validation("purchase order not found".to_string()))?;

    if order.status != "Draft" {
        return Err(AppError::Validation(format!("purchase order is already {}", order.status)));
    }

    let items = sqlx::query!(
        r#"SELECT product_id, quantity, unit_cost FROM purchase_order_items WHERE purchase_order_id = $1"#,
        id
    )
    .fetch_all(&mut *tx)
    .await?;

    for item in &items {
        sqlx::query!(
            r#"
            INSERT INTO stock_movements (
                tenant_id, workspace_id, product_id, movement_type,
                quantity_in, unit_cost, reason, created_by
            )
            VALUES ($1, $2, $3, 'Purchase', $4, $5, $6, $7)
            "#,
            tenant_id,
            order.workspace_id,
            item.product_id,
            item.quantity,
            item.unit_cost,
            format!("Received PO {}", id),
            auth_user.user_id
        )
        .execute(&mut *tx)
        .await?;

        let existing = sqlx::query!(
            r#"
            SELECT quantity_available, average_cost
            FROM stock_balances
            WHERE workspace_id = $1 AND product_id = $2
            FOR UPDATE
            "#,
            order.workspace_id,
            item.product_id
        )
        .fetch_optional(&mut *tx)
        .await?;

        let (new_quantity, new_avg_cost) = match existing {
            Some(row) => {
                let total_qty = row.quantity_available + item.quantity;
                let new_avg = if total_qty > Decimal::ZERO {
                    (row.quantity_available * row.average_cost + item.quantity * item.unit_cost) / total_qty
                } else {
                    item.unit_cost
                };
                (total_qty, new_avg)
            }
            None => (item.quantity, item.unit_cost),
        };

        sqlx::query!(
            r#"
            INSERT INTO stock_balances (tenant_id, workspace_id, product_id, quantity_available, average_cost, updated_at)
            VALUES ($1, $2, $3, $4, $5, now())
            ON CONFLICT (workspace_id, product_id)
            DO UPDATE SET quantity_available = $4, average_cost = $5, updated_at = now()
            "#,
            tenant_id,
            order.workspace_id,
            item.product_id,
            new_quantity,
            new_avg_cost
        )
        .execute(&mut *tx)
        .await?;
    }

    sqlx::query!(
        "UPDATE purchase_orders SET status = 'Received', received_at = now() WHERE id = $1",
        id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "receive_purchase_order", "procurement")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}
