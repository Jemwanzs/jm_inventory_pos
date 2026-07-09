use axum::{extract::State, Json};
use rust_decimal::Decimal;
use serde::Serialize;

use crate::{auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

#[derive(Serialize)]
pub struct DashboardSummary {
    stock_value: Decimal,
    product_count: i64,
    workspace_count: i64,
    movements_today: i64,
}

pub async fn get_summary(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<DashboardSummary>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let row = sqlx::query!(
        r#"
        SELECT
            COALESCE((SELECT SUM(quantity_available * average_cost) FROM stock_balances WHERE tenant_id = $1), 0) AS "stock_value!",
            (SELECT COUNT(*) FROM products WHERE tenant_id = $1 AND is_active) AS "product_count!",
            (SELECT COUNT(*) FROM workspaces WHERE tenant_id = $1 AND is_active) AS "workspace_count!",
            (SELECT COUNT(*) FROM stock_movements WHERE tenant_id = $1 AND created_at >= date_trunc('day', now())) AS "movements_today!"
        "#,
        tenant_id
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(DashboardSummary {
        stock_value: row.stock_value,
        product_count: row.product_count,
        workspace_count: row.workspace_count,
        movements_today: row.movements_today,
    }))
}
