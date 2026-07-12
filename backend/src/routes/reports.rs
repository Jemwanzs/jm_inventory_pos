use axum::{extract::State, Json};
use rust_decimal::Decimal;
use serde::Serialize;

use crate::{auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct TopProduct {
    product_name: String,
    quantity_sold: Decimal,
    revenue: Decimal,
}

#[derive(Serialize)]
pub struct ReportsSummary {
    total_revenue: Decimal,
    total_cogs: Decimal,
    gross_profit: Decimal,
    total_purchases: Decimal,
    sales_count: i64,
    stock_value: Decimal,
    top_products: Vec<TopProduct>,
}

// A single cross-module rollup rather than a dozen thin report screens —
// revenue/COGS come from sales + the Sale movements' unit_cost (the same
// COGS figure the POS checkout transaction recorded), purchases from
// received POs, and stock value from the same balances Dashboard shows.
pub async fn get_summary(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<ReportsSummary>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let totals = sqlx::query!(
        r#"
        SELECT
            COALESCE((SELECT SUM(total) FROM sales WHERE tenant_id = $1), 0) AS "total_revenue!",
            COALESCE((SELECT COUNT(*) FROM sales WHERE tenant_id = $1), 0) AS "sales_count!",
            COALESCE(
                (SELECT SUM(quantity_out * unit_cost) FROM stock_movements
                 WHERE tenant_id = $1 AND movement_type = 'Sale'),
                0
            ) AS "total_cogs!",
            COALESCE(
                (SELECT SUM(poi.quantity * poi.unit_cost)
                 FROM purchase_order_items poi
                 JOIN purchase_orders po ON po.id = poi.purchase_order_id
                 WHERE po.tenant_id = $1 AND po.status = 'Received'),
                0
            ) AS "total_purchases!",
            COALESCE((SELECT SUM(quantity_available * average_cost) FROM stock_balances WHERE tenant_id = $1), 0) AS "stock_value!"
        "#,
        tenant_id
    )
    .fetch_one(&state.db)
    .await?;

    let top_products = sqlx::query_as!(
        TopProduct,
        r#"
        SELECT
            p.name AS product_name,
            SUM(si.quantity) AS "quantity_sold!",
            SUM(si.line_total) AS "revenue!"
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        JOIN products p ON p.id = si.product_id
        WHERE s.tenant_id = $1
        GROUP BY p.name
        ORDER BY SUM(si.line_total) DESC
        LIMIT 5
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(ReportsSummary {
        total_revenue: totals.total_revenue,
        total_cogs: totals.total_cogs,
        gross_profit: totals.total_revenue - totals.total_cogs,
        total_purchases: totals.total_purchases,
        sales_count: totals.sales_count,
        stock_value: totals.stock_value,
        top_products,
    }))
}
