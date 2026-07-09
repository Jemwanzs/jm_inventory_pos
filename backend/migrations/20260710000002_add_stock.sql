-- Maintained current-stock table, distinct from the stock_movements
-- ledger below — see docs/backend-architecture.md Stock Transaction
-- Rules for why both exist (balance is a materialized view of the
-- ledger, kept in sync in the same transaction as every movement).
CREATE TABLE stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_available NUMERIC(14, 2) NOT NULL DEFAULT 0,
    average_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, product_id)
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    product_id UUID NOT NULL REFERENCES products(id),
    movement_type TEXT NOT NULL,
    quantity_in NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quantity_out NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(14, 2),
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_balances_tenant_id ON stock_balances(tenant_id);
CREATE INDEX idx_stock_balances_workspace_id ON stock_balances(workspace_id);
CREATE INDEX idx_stock_movements_tenant_id ON stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_workspace_id ON stock_movements(workspace_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
