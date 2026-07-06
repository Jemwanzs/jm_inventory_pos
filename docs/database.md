← [README](../README.md) · [Architecture](architecture.md) · [Core Modules](modules.md) · [Roadmap](roadmap.md)

---

## 10. Audit Logs

Every important activity is tracked: user, action, module, record affected, old value, new value, date/time, IP/device where possible, workspace, tenant, approval status.

Audit logs are **append-only** — never editable.

---

## 11. Database Structure (initial)

Core tables:

`tenants`, `users`, `roles`, `permissions`, `user_roles`, `workspaces`, `branches`, `stores`, `products`, `product_categories`, `product_brands`, `units_of_measure`, `stock_batches`, `stock_movements`, `stock_adjustments`, `stock_transfers`, `purchases`, `purchase_items`, `suppliers`, `customers`, `sales`, `sale_items`, `payments`, `invoices`, `quotations`, `proformas`, `receipts`, `approvals`, `approval_steps`, `documents`, `notifications`, `audit_logs`, `settings`, `pos_settings`, `inventory_settings`

Extended tables (supporting the [Core Modules'](modules.md#9-core-modules) additional modules):

`subscriptions`, `plans`, `tenant_modules`, `industry_templates`, `product_variants`, `price_lists`, `stock_reservations`, `warranties`, `production_orders`, `recipes`, `recipe_items`, `cash_sessions`, `returns`, `refunds`, `api_keys`, `integrations`, `custom_fields`, `custom_field_values`, `numbering_sequences`, `stock_count_sessions`, `stock_count_items`, `risk_alerts`, `notification_rules`, `tasks`, `employee_activity_logs`, `document_templates`, `communication_templates`, `communication_logs`, `data_retention_policies`, `currencies`, `exchange_rates`, `languages`, `translations`, `background_jobs`, `system_health_metrics`, `unit_conversions`, `stock_ownership`, `bundles`, `bundle_items`, `requisitions`, `dispatches`, `expenses`, `commissions`, `shift_handover_notes`, `price_history`, `customer_orders`, `deposits`, `service_jobs`, `rentals`, `tenant_groups`, `period_locks`, `approval_delegations`, `pos_devices`

Every business-level table includes: `tenant_id`, `workspace_id` (where applicable), `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at` (soft delete).

Table grouping follows the schema separation described in [Platform & Infrastructure Architecture](architecture.md#platform--infrastructure-architecture).
