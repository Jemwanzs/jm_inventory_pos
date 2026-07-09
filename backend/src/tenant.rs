use sqlx::PgPool;
use uuid::Uuid;

use crate::{auth::extractor::AuthUser, error::AppError};

/// Tenant-scoped users (tenant_id set) manage their own tenant's data.
/// Platform-level users (tenant_id NULL, e.g. the super admin) manage the
/// single default tenant created by `bootstrap::ensure_default_tenant`
/// until real per-tenant admin membership exists — see
/// docs/backend-architecture.md's current-vs-target notes.
pub async fn resolve_tenant_id(pool: &PgPool, auth_user: &AuthUser) -> Result<Uuid, AppError> {
    if let Some(tenant_id) = auth_user.tenant_id {
        return Ok(tenant_id);
    }

    sqlx::query_scalar!("SELECT id FROM tenants ORDER BY created_at LIMIT 1")
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("no tenant configured")))
}
