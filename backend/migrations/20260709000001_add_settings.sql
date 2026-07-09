-- Generic per-category JSONB settings blob per tenant. `category` is
-- validated by application code against a fixed allowlist (business,
-- inventory, pos, tax, notifications, security) — see
-- backend/src/routes/settings.rs. Chosen over one rigid table per
-- category so new settings fields don't need a migration every time.
CREATE TABLE tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    category TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, category)
);

-- Branches, warehouses, stores, POS counters — a real list, not a
-- settings blob.
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per document type (product, invoice, receipt, purchase_order,
-- quotation, ...). See docs/backend-architecture.md Settings Architecture.
CREATE TABLE numbering_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    document_type TEXT NOT NULL,
    prefix TEXT NOT NULL DEFAULT '',
    include_year BOOLEAN NOT NULL DEFAULT FALSE,
    include_month BOOLEAN NOT NULL DEFAULT FALSE,
    sequence_length INT NOT NULL DEFAULT 4,
    separator TEXT NOT NULL DEFAULT '-',
    next_number INT NOT NULL DEFAULT 1,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, document_type)
);

CREATE INDEX idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);
CREATE INDEX idx_workspaces_tenant_id ON workspaces(tenant_id);
CREATE INDEX idx_numbering_sequences_tenant_id ON numbering_sequences(tenant_id);
