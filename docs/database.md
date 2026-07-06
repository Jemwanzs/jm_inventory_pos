← [README](../README.md) · [Architecture](architecture.md) · [Core Modules](modules.md) · [Backend Architecture](backend-architecture.md) · [Roadmap](roadmap.md)

---

## 10. Audit Logs

Every important activity is tracked: user, action, module, record affected, old value, new value, date/time, IP/device where possible, workspace, tenant, approval status.

At minimum, log: login, failed login, product creation/update, price change, stock movement/adjustment/transfer/write-off, sale cancellation, discount override, refund, user creation, role change, settings update, report export.

Audit logs are **append-only** — never editable. `login_logs` and `activity_logs` sit alongside `audit_logs` in the `audit` schema (see below) for high-volume, lower-stakes events (every login attempt, every page/action view) that don't belong in the same table as sensitive business audit entries.

---

## 11. Database Structure (initial)

Tables grouped by domain — see [Backend Architecture: Database Organized by Domain](backend-architecture.md#database-organized-by-domain) for the reasoning (Postgres schema-per-domain, not just a flat `public` schema) and field-level definitions of the most important tables.

**`core`** — `tenants`, `users`, `roles`, `permissions`, `user_roles`, `workspaces`, `branches`, `stores`, `subscriptions`, `plans`, `tenant_modules`, `industry_templates`

**`inventory`** — `products`, `product_variants`, `product_categories`, `product_brands`, `units_of_measure`, `stock_balances`, `stock_batches`, `stock_movements`, `stock_adjustments`, `stock_transfers`, `stock_count_sessions`, `stock_count_items`, `stock_reservations`, `stock_ownership`, `unit_conversions`, `bundles`, `bundle_items`, `warranties`

**`procurement`** — `suppliers`, `purchase_requests`, `purchase_orders`, `purchase_order_items`, `goods_received_notes`, `supplier_invoices`, `requisitions`, `dispatches`

**`sales`** — `customers`, `customer_orders`, `sales`, `sale_items`, `payments`, `invoices`, `receipts`, `quotations`, `proformas`, `returns`, `refunds`, `deposits`, `service_jobs`, `rentals`, `commissions`, `price_history`, `price_lists`

**`finance`** — `cash_sessions`, `cash_movements`, `shift_handover_notes`, `expenses`, `customer_credit_accounts`, `supplier_payment_records`

**`workflow`** — `approval_workflows`, `approval_steps`, `approval_requests`, `approval_actions`, `approval_delegations`

**`documents`** — `documents`, `document_links`, `file_versions`, `document_templates`

**`audit`** — `audit_logs`, `login_logs`, `activity_logs`, `employee_activity_logs`, `risk_alerts`, `system_health_metrics`

**`settings`** — `settings`, `business_settings`, `inventory_settings`, `pos_settings`, `notification_settings`, `notification_rules`, `numbering_sequences`, `custom_fields`, `custom_field_values`, `data_retention_policies`

**Production** — `production_orders`, `recipes`, `recipe_items`

**Platform / integrations** — `api_keys`, `integrations`, `notifications`, `communication_templates`, `communication_logs`, `currencies`, `exchange_rates`, `languages`, `translations`, `background_jobs`, `tenant_groups`, `period_locks`, `pos_devices`, `tasks`

Every business-level table includes: `tenant_id`, `workspace_id` (where applicable), `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at` (soft delete).

**Changes from the original flat list**, for anyone diffing against an earlier version of this doc: `purchases`/`purchase_items` split into the fuller procurement flow (`purchase_requests`, `purchase_orders`, `purchase_order_items`, `goods_received_notes`, `supplier_invoices`); `approvals` replaced by the generic `approval_workflows`/`approval_requests`/`approval_actions` pattern (`approval_steps` now defines a workflow's steps rather than being a per-request log); `stock_balances` added as a maintained current-stock table distinct from the `stock_movements` ledger — see [Stock Transaction Rules](backend-architecture.md#stock-transaction-rules) for why both exist.

Currently migrated (V1 auth-core slice only): `tenants`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `audit_logs` — see [backend/migrations/](../backend/migrations/).
