use sqlx::PgPool;

use crate::{audit, auth::password};

/// Creates the platform super admin on first startup if one doesn't exist
/// yet. The temporary password is generated at runtime and printed to the
/// log exactly once — it is never hardcoded and never stored anywhere else.
pub async fn ensure_super_admin(pool: &PgPool, email: &str) -> anyhow::Result<()> {
    let existing: Option<(uuid::Uuid,)> = sqlx::query_as(
        r#"
        SELECT u.id
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE r.name = 'super_admin'
        LIMIT 1
        "#,
    )
    .fetch_optional(pool)
    .await?;

    if existing.is_some() {
        return Ok(());
    }

    let temp_password = password::generate_temporary_password();
    let password_hash = password::hash_password(&temp_password)
        .map_err(|err| anyhow::anyhow!("failed to hash bootstrap password: {err}"))?;

    let mut tx = pool.begin().await?;

    let (user_id,): (uuid::Uuid,) = sqlx::query_as(
        r#"
        INSERT INTO users (tenant_id, email, full_name, password_hash, must_change_password)
        VALUES (NULL, $1, 'Super Admin', $2, TRUE)
        RETURNING id
        "#,
    )
    .bind(email)
    .bind(&password_hash)
    .fetch_one(&mut *tx)
    .await?;

    let (role_id,): (uuid::Uuid,) =
        sqlx::query_as("SELECT id FROM roles WHERE tenant_id IS NULL AND name = 'super_admin'")
            .fetch_one(&mut *tx)
            .await?;

    sqlx::query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)")
        .bind(user_id)
        .bind(role_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    audit::record(pool, None, Some(user_id), "bootstrap_super_admin", "auth").await?;

    tracing::warn!(
        "Bootstrapped super admin account.\n  email:    {email}\n  password: {temp_password}\n\
         This password is shown ONLY here — it must be changed on first login."
    );

    Ok(())
}

/// Creates a single default tenant on first startup if none exists, so
/// Settings has something real to configure before tenant creation
/// (Administration → Tenants) is built. Platform-level users (tenant_id
/// NULL) manage this tenant's settings via `tenant::resolve_tenant_id`.
/// Returns the tenant id either way, for `ensure_default_roles`.
pub async fn ensure_default_tenant(pool: &PgPool) -> anyhow::Result<uuid::Uuid> {
    if let Some((id,)) = sqlx::query_as::<_, (uuid::Uuid,)>("SELECT id FROM tenants LIMIT 1")
        .fetch_optional(pool)
        .await?
    {
        return Ok(id);
    }

    let (tenant_id,): (uuid::Uuid,) =
        sqlx::query_as("INSERT INTO tenants (name) VALUES ('My Business') RETURNING id")
            .fetch_one(pool)
            .await?;

    tracing::info!(%tenant_id, "Created default tenant 'My Business' for initial settings.");

    Ok(tenant_id)
}

/// Seeds a starter set of tenant-scoped roles so the Roles & Permissions
/// matrix has something real to show before a tenant admin creates their
/// own. Idempotent — only inserts roles that don't already exist by name
/// for this tenant.
pub async fn ensure_default_roles(pool: &PgPool, tenant_id: uuid::Uuid) -> anyhow::Result<()> {
    const STARTER_ROLES: &[(&str, &str)] = &[
        ("Tenant Admin", "Full access within this business"),
        ("Branch Manager", "Manages a single branch's operations"),
        ("Cashier", "Runs the POS and records sales"),
        ("Viewer", "Read-only access"),
    ];

    for (name, description) in STARTER_ROLES {
        sqlx::query(
            r#"
            INSERT INTO roles (tenant_id, name, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (tenant_id, name) DO NOTHING
            "#,
        )
        .bind(tenant_id)
        .bind(name)
        .bind(description)
        .execute(pool)
        .await?;
    }

    Ok(())
}
