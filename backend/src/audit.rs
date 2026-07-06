use sqlx::PgPool;
use uuid::Uuid;

/// Inserts an append-only audit log entry. Callers must never update or
/// delete rows in `audit_logs` — see docs/database.md.
pub async fn record(
    pool: &PgPool,
    tenant_id: Option<Uuid>,
    user_id: Option<Uuid>,
    action: &str,
    module: &str,
) -> anyhow::Result<()> {
    sqlx::query(
        r#"
        INSERT INTO audit_logs (tenant_id, user_id, action, module)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(tenant_id)
    .bind(user_id)
    .bind(action)
    .bind(module)
    .execute(pool)
    .await?;

    Ok(())
}
