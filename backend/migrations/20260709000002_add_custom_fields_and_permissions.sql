-- Tenant-defined extra fields on products/customers/suppliers/sales/purchases.
-- See docs/modules.md Module AB (Dynamic Custom Fields Engine).
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    module TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, module, field_name)
);

CREATE INDEX idx_custom_fields_tenant_id ON custom_fields(tenant_id);

-- Permission catalog is global (not tenant-scoped) — every tenant assigns
-- the same fixed set of permissions to its own roles via role_permissions.
-- code is "{module}.{action}"; the Roles & Permissions matrix screen
-- splits on "." to build its grid rather than needing separate columns.
INSERT INTO permissions (code, description) VALUES
    ('products.view', 'View products'),
    ('products.create', 'Create products'),
    ('products.edit', 'Edit products'),
    ('products.delete', 'Delete products'),
    ('products.export', 'Export product data'),
    ('inventory.view', 'View stock balances and movements'),
    ('inventory.create', 'Record stock movements'),
    ('inventory.edit', 'Edit stock records'),
    ('inventory.approve', 'Approve stock adjustments and write-offs'),
    ('inventory.export', 'Export inventory data'),
    ('procurement.view', 'View purchases and suppliers'),
    ('procurement.create', 'Create purchase requests and orders'),
    ('procurement.edit', 'Edit purchase records'),
    ('procurement.approve', 'Approve purchase requests and orders'),
    ('pos.view', 'View sales'),
    ('pos.create', 'Process sales at the POS'),
    ('pos.edit', 'Edit sales records'),
    ('pos.approve', 'Approve discounts and refunds'),
    ('customers.view', 'View customers'),
    ('customers.create', 'Create customers'),
    ('customers.edit', 'Edit customers'),
    ('suppliers.view', 'View suppliers'),
    ('suppliers.create', 'Create suppliers'),
    ('suppliers.edit', 'Edit suppliers'),
    ('reports.view', 'View reports'),
    ('reports.export', 'Export reports'),
    ('settings.view', 'View settings'),
    ('settings.manage', 'Change settings')
ON CONFLICT (code) DO NOTHING;
