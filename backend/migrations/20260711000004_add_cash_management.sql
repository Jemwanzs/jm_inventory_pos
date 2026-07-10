CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    cashier_id UUID NOT NULL REFERENCES users(id),
    opening_float NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Open',
    expected_cash NUMERIC(14, 2),
    actual_cash NUMERIC(14, 2),
    variance NUMERIC(14, 2),
    notes TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ
);

CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cash_sessions_tenant_id ON cash_sessions(tenant_id);
CREATE INDEX idx_cash_movements_session_id ON cash_movements(session_id);
