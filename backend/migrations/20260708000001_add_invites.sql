-- Invite-based signup: an authenticated user creates an invite for an email
-- address; the invitee follows a link containing the raw token, which we
-- only ever store hashed (same reasoning as password storage — a DB leak
-- shouldn't hand out usable invite links).
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES users(id),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_token_hash ON invites(token_hash);
CREATE INDEX idx_invites_email ON invites(email);
