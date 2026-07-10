use axum::{extract::State, Json};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

const PAYMENT_METHODS: &[&str] = &["Cash", "M-Pesa", "Card", "Bank", "Credit"];

#[derive(Serialize)]
pub struct SaleResponse {
    id: Uuid,
    workspace_name: String,
    customer_name: Option<String>,
    cashier_email: String,
    item_count: i64,
    total: Decimal,
    payment_method: String,
    amount_paid: Decimal,
    created_at: DateTime<Utc>,
}

pub async fn list_sales(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<SaleResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let sales = sqlx::query_as!(
        SaleResponse,
        r#"
        SELECT
            s.id, w.name AS workspace_name, c.name AS "customer_name?", u.email AS cashier_email,
            COALESCE(i.item_count, 0) AS "item_count!",
            s.total, s.payment_method, s.amount_paid, s.created_at
        FROM sales s
        JOIN workspaces w ON w.id = s.workspace_id
        JOIN users u ON u.id = s.cashier_id
        LEFT JOIN customers c ON c.id = s.customer_id
        LEFT JOIN (
            SELECT sale_id, COUNT(*) AS item_count FROM sale_items GROUP BY sale_id
        ) i ON i.sale_id = s.id
        WHERE s.tenant_id = $1
        ORDER BY s.created_at DESC
        LIMIT 100
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(sales))
}

#[derive(Deserialize)]
pub struct SaleItemRequest {
    product_id: Uuid,
    quantity: Decimal,
    unit_price: Decimal,
}

#[derive(Deserialize)]
pub struct CreateSaleRequest {
    workspace_id: Uuid,
    customer_id: Option<Uuid>,
    payment_method: String,
    amount_paid: Decimal,
    items: Vec<SaleItemRequest>,
}

#[derive(Serialize)]
pub struct CreateSaleResponse {
    id: Uuid,
    total: Decimal,
}

// Checkout is the integration point between POS, Inventory, and Cash
// Management: every line item deducts stock (stock_movements + a
// stock_balances decrement, mirroring the same ledger pattern used by
// Add Stock and PO receiving), and a Cash payment auto-records an "In"
// cash movement against the cashier's open shift if they have one.
pub async fn create_sale(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateSaleRequest>,
) -> Result<Json<CreateSaleResponse>, AppError> {
    if req.items.is_empty() {
        return Err(AppError::Validation("a sale needs at least one item".to_string()));
    }
    if !PAYMENT_METHODS.contains(&req.payment_method.as_str()) {
        return Err(AppError::Validation(format!("unknown payment method '{}'", req.payment_method)));
    }
    for item in &req.items {
        if item.quantity <= Decimal::ZERO {
            return Err(AppError::Validation("item quantity must be greater than zero".to_string()));
        }
        if item.unit_price < Decimal::ZERO {
            return Err(AppError::Validation("item price cannot be negative".to_string()));
        }
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let mut tx = state.db.begin().await?;

    let mut subtotal = Decimal::ZERO;
    for item in &req.items {
        subtotal += item.quantity * item.unit_price;
    }

    let sale_id = sqlx::query_scalar!(
        r#"
        INSERT INTO sales (tenant_id, workspace_id, customer_id, cashier_id, subtotal, total, payment_method, amount_paid)
        VALUES ($1, $2, $3, $4, $5, $5, $6, $7)
        RETURNING id
        "#,
        tenant_id,
        req.workspace_id,
        req.customer_id,
        auth_user.user_id,
        subtotal,
        req.payment_method,
        req.amount_paid
    )
    .fetch_one(&mut *tx)
    .await?;

    for item in &req.items {
        let line_total = item.quantity * item.unit_price;

        sqlx::query!(
            r#"
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total)
            VALUES ($1, $2, $3, $4, $5)
            "#,
            sale_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            line_total
        )
        .execute(&mut *tx)
        .await?;

        let balance = sqlx::query!(
            r#"
            SELECT sb.quantity_available, sb.average_cost, p.name AS product_name
            FROM stock_balances sb
            JOIN products p ON p.id = sb.product_id
            WHERE sb.workspace_id = $1 AND sb.product_id = $2
            FOR UPDATE
            "#,
            req.workspace_id,
            item.product_id
        )
        .fetch_optional(&mut *tx)
        .await?
        .ok_or_else(|| AppError::Validation("insufficient stock for one of the items".to_string()))?;

        if balance.quantity_available < item.quantity {
            return Err(AppError::Validation(format!(
                "insufficient stock for {}: {} available, {} requested",
                balance.product_name, balance.quantity_available, item.quantity
            )));
        }

        sqlx::query!(
            r#"
            INSERT INTO stock_movements (
                tenant_id, workspace_id, product_id, movement_type,
                quantity_out, unit_cost, reason, created_by
            )
            VALUES ($1, $2, $3, 'Sale', $4, $5, $6, $7)
            "#,
            tenant_id,
            req.workspace_id,
            item.product_id,
            item.quantity,
            balance.average_cost,
            format!("Sale {}", sale_id),
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
            item.product_id,
            item.quantity
        )
        .execute(&mut *tx)
        .await?;
    }

    if req.payment_method == "Cash" {
        let open_session = sqlx::query_scalar!(
            r#"SELECT id FROM cash_sessions WHERE tenant_id = $1 AND cashier_id = $2 AND status = 'Open'"#,
            tenant_id,
            auth_user.user_id
        )
        .fetch_optional(&mut *tx)
        .await?;

        if let Some(session_id) = open_session {
            sqlx::query!(
                r#"
                INSERT INTO cash_movements (tenant_id, session_id, movement_type, amount, reason, created_by)
                VALUES ($1, $2, 'In', $3, $4, $5)
                "#,
                tenant_id,
                session_id,
                req.amount_paid,
                format!("Sale {}", sale_id),
                auth_user.user_id
            )
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_sale", "pos")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(CreateSaleResponse { id: sale_id, total: subtotal }))
}
