CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    threshold NUMERIC(14, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE approval_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    approver_user_id UUID NOT NULL REFERENCES users(id),
    UNIQUE (workflow_id, step_order)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    body TEXT,
    link_module TEXT,
    link_reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE approval_requests
    ADD COLUMN workflow_id UUID REFERENCES approval_workflows(id),
    ADD COLUMN step_order INT NOT NULL DEFAULT 1,
    ADD COLUMN total_steps INT NOT NULL DEFAULT 1,
    ADD COLUMN payload JSONB;

CREATE INDEX idx_approval_workflows_tenant_id ON approval_workflows(tenant_id);
CREATE INDEX idx_approval_workflows_trigger ON approval_workflows(tenant_id, trigger_type);
CREATE INDEX idx_approval_workflow_steps_workflow_id ON approval_workflow_steps(workflow_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
