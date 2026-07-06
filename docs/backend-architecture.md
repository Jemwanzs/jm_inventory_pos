← [README](../README.md) · [Architecture](architecture.md) · [Core Modules](modules.md) · [Database](database.md) · [UI/UX](ui-ux.md) · [Screens](screens.md) · [Roadmap](roadmap.md) · [Deployment](deployment.md)

---

## Status vs. this spec

This doc captures the target backend architecture at full scale. What's actually built today (see [README status](../README.md#status)) is one Axum binary with an `auth` module — a single vertical slice, not yet organized into the domain modules or schemas below. Treat this as the map we build toward module-by-module, not a description of current code. Update the "current vs. target" notes inline as each piece lands.

---

## Backend Architecture Goal

A secure, scalable, multi-tenant backend supporting inventory management, POS/sales, procurement, stock movement, multi-branch operations, approvals, reports, documents, roles/permissions, audit logs, and future AI/integrations — modular and clean enough to support many businesses without ever mixing tenant data.

**Stack:** Rust, Axum, PostgreSQL, SQLx, Redis, JWT auth, object storage, background workers, OpenAPI docs (see [Technology Stack](../README.md#2-technology-stack)).

**Service split (target, not V1):** API service, worker service, report service, notification service, file storage service. V1 ships as a single Axum binary — see [Platform & Infrastructure Architecture](architecture.md#platform--infrastructure-architecture) for the background-worker split, which is the first service we'd peel off once report generation or email sending starts competing with request latency. Don't build the other splits before that pressure exists.

---

## Multi-Tenant Database Approach

One shared PostgreSQL database, strict `tenant_id` isolation — not database-per-tenant or schema-per-tenant. Every business-level table carries `tenant_id`, `workspace_id` (where applicable), `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at` (see [Database Structure](database.md#database-structure)).

Every query touching tenant data must filter by `tenant_id`. A user from Tenant A must never be able to reach Tenant B's rows — this is enforced at the repository/query layer, not left to the caller to remember.

---

## Database Organized by Domain

The flat table list in [docs/database.md](database.md) groups logically into these schemas. Use Postgres schemas (not just naming convention) once the table count makes a flat `public` schema hard to navigate:

| Schema | Owns |
|---|---|
| `core` | tenants, users, roles, permissions, user_roles, workspaces, branches, stores, subscriptions, plans, tenant_modules |
| `inventory` | products, product_variants, product_categories, product_brands, units_of_measure, stock_balances, stock_movements, stock_batches, stock_adjustments, stock_transfers, stock_counts, stock_count_items |
| `procurement` | suppliers, purchase_requests, purchase_orders, purchase_order_items, goods_received_notes, supplier_invoices |
| `sales` | customers, sales, sale_items, payments, invoices, receipts, quotations, proformas, returns, refunds |
| `finance` | cash_sessions, cash_movements, expenses, customer_credit_accounts, supplier_payment_records |
| `workflow` | approval_workflows, approval_steps, approval_requests, approval_actions |
| `documents` | documents, document_links, file_versions |
| `audit` | audit_logs, login_logs, activity_logs |
| `settings` | business_settings, inventory_settings, pos_settings, notification_settings, numbering_settings, custom_fields, custom_field_values |

Two refinements versus the original flat table list worth calling out:

- **`stock_balances` is new.** Current stock per workspace/product/variant should be a maintained, queryable balance — not something recomputed from `stock_movements` on every read. Every stock-changing operation updates `stock_balances` and appends to `stock_movements` in the same transaction.
- **Approvals become generic** (`approval_workflows` / `approval_steps` / `approval_requests` / `approval_actions`) rather than one bespoke approvals table per module. See [Approval Architecture](#approval-architecture) below.

---

## Core Tables (field-level)

**`tenants`** — `id`, `name`, `legal_name`, `industry_type`, `email`, `phone`, `logo_url`, `currency`, `status`, `created_at`, `updated_at`

**`users`** — `id`, `tenant_id`, `workspace_id`, `name`, `email`, `phone`, `password_hash`, `status`, `last_login_at`, `force_password_change`, `created_at`, `updated_at`

**`roles`** — `id`, `tenant_id`, `name`, `description`, `is_system_role`

**`permissions`** — `id`, `module`, `action`, `description` — actions: view, create, edit, delete, approve, export, download, manage

**`workspaces`** — `id`, `tenant_id`, `name`, `type` — types: Branch, Warehouse, Store, POS Counter, Restaurant Floor

_Current vs. target: the shipped `users` migration uses `must_change_password` where this spec says `force_password_change`, and doesn't yet have `phone`/`status`/`last_login_at`/`workspace_id`. Reconcile naming when the workspaces module lands rather than renaming now for no functional reason._

---

## Inventory Tables (field-level)

**`products`** — `id`, `tenant_id`, `name`, `sku`, `barcode`, `category_id`, `brand_id`, `unit_id`, `description`, `image_url`, `product_type`, `status`, `track_serial`, `track_batch`, `track_expiry`, `created_at`, `updated_at`

**`product_variants`** — `id`, `tenant_id`, `product_id`, `variant_name`, `sku`, `barcode`, `attributes`, `cost_price`, `selling_price`, `status` (see [Module K](modules.md#k-product-variants))

**`stock_balances`** — `id`, `tenant_id`, `workspace_id`, `product_id`, `variant_id`, `quantity_available`, `quantity_reserved`, `quantity_damaged`, `quantity_expired`, `average_cost`

**`stock_movements`** — `id`, `tenant_id`, `workspace_id`, `product_id`, `variant_id`, `movement_type`, `quantity_in`, `quantity_out`, `reference_type`, `reference_id`, `reason`, `created_by`, `created_at`

Movement types: Opening Stock, Purchase, Sale, Transfer In, Transfer Out, Adjustment, Return, Damage, Expiry, Write-Off.

---

## Sales & POS Tables (field-level)

**`sales`** — `id`, `tenant_id`, `workspace_id`, `customer_id`, `sale_number`, `sale_type`, `subtotal`, `discount_total`, `tax_total`, `grand_total`, `payment_status`, `sale_status`, `cashier_id`, `created_at`

**`sale_items`** — `id`, `tenant_id`, `sale_id`, `product_id`, `variant_id`, `quantity`, `unit_price`, `discount`, `tax`, `line_total`, `cost_price`, `profit_amount`

**`payments`** — `id`, `tenant_id`, `sale_id`, `payment_method`, `amount`, `reference_number`, `payment_date`, `recorded_by`

**`cash_sessions`** — `id`, `tenant_id`, `workspace_id`, `cashier_id`, `opening_float`, `expected_cash`, `actual_cash`, `variance`, `status`, `opened_at`, `closed_at` (see [Module Q](modules.md#q-cash-management))

---

## Procurement Tables (field-level)

**`suppliers`** — `id`, `tenant_id`, `name`, `contact_person`, `phone`, `email`, `address`, `status`

**`purchase_orders`** — `id`, `tenant_id`, `supplier_id`, `workspace_id`, `po_number`, `status`, `total_amount`, `approval_status`, `created_by`, `created_at`

**`purchase_order_items`** — `id`, `tenant_id`, `purchase_order_id`, `product_id`, `variant_id`, `quantity`, `unit_cost`, `total_cost`

Flow: Purchase Request → Approval → Purchase Order → Goods Received → Stock Update → Supplier Invoice.

---

## Approval Architecture

Generic across every module — don't build separate approval logic per feature.

- **`approval_workflows`** — `id`, `tenant_id`, `module`, `action`, `name`, `is_active` (e.g. module=Inventory, action=Stock Adjustment)
- **`approval_steps`** — `id`, `workflow_id`, `step_order`, `approver_type`, `approver_role_id`, `approver_user_id`
- **`approval_requests`** — `id`, `tenant_id`, `workflow_id`, `reference_type`, `reference_id`, `status`, `requested_by`, `requested_at`
- **`approval_actions`** — `id`, `approval_request_id`, `approver_id`, `action`, `comment`, `action_at`

This is what backs [Module V, Approval Inbox](modules.md#v-approval-inbox), [Module AF, Maker-Checker](modules.md#af-maker-checker-controls) (enforced as `approver_id != requested_by` at the service layer), and [Module BI, Approval Delegation](modules.md#bi-approval-delegation) (a delegation record substitutes the resolved `approver_user_id` for a step, within a date range).

---

## Documents Architecture

Documents are attachable to any record via a link table, not a foreign key per module:

- **`documents`** — `id`, `tenant_id`, `file_name`, `file_type`, `file_url`, `file_size`, `uploaded_by`, `uploaded_at`
- **`document_links`** — `id`, `tenant_id`, `document_id`, `linked_module`, `linked_record_id`
- **`file_versions`** — supports replace-with-history rather than overwrite, per [Module AM](modules.md#am-document-template-designer)-adjacent needs and the [Document Management UI](ui-ux.md#document-management)

E.g. one receipt document can link to a stock purchase, a sale, a supplier, a product, and a customer simultaneously without four different foreign key columns.

---

## Settings Architecture

Dynamic settings tables per category rather than hardcoding every business rule into application logic — see [Settings and Configuration](modules.md#b-settings-and-configuration) for the functional list. Representative keys:

- `inventory_settings`: `allow_negative_stock`, `require_approval_for_adjustment`, `default_valuation_method`, `enable_batch_tracking`, `enable_expiry_tracking`
- `pos_settings`: `allow_discount`, `max_discount_percentage`, `require_manager_pin_for_discount`, `enable_credit_sales`, `enable_shift_closure`, `receipt_template_id`
- `numbering_settings`: `prefix`, `branch_code`, `year_enabled`, `month_enabled`, `sequence_length`, `separator`, `next_number` — backs [Module AC, Custom Numbering Engine](modules.md#ac-custom-numbering-engine)

---

## API Structure

REST, grouped by domain. Representative routes per group (not exhaustive — expand as each module is built):

- **Auth:** `POST /auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password` — login/change-password shipped, see [backend/src/routes/auth.rs](../backend/src/routes/auth.rs)
- **Tenants:** `GET/POST /tenants`, `GET/PATCH /tenants/:id`, `POST /tenants/:id/activate`, `POST /tenants/:id/suspend`
- **Products:** `GET/POST /products`, `GET/PATCH/DELETE /products/:id`, `POST /products/:id/images`, `GET /products/:id/history`
- **Stock:** `GET /stock/balances`, `POST /stock/opening`, `/stock/adjustments`, `/stock/transfers`, `/stock/counts`, `GET /stock/movements`, `/stock/low-stock`
- **POS:** `POST /pos/sales`, `/pos/sales/hold`, `/pos/sales/:id/checkout`, `/pos/sales/:id/return`, `GET /pos/sales`, `/pos/receipts/:id`
- **Reports:** `GET /reports/stock-balance`, `/sales`, `/profit`, `/purchases`, `/cashier`, `POST /reports/export`
- **Approvals:** `GET /approvals/pending`, `POST /approvals/:id/approve`, `/approvals/:id/reject`, `GET /approvals/history`
- **Settings:** `GET /settings`, `PATCH /settings/business`, `/inventory`, `/pos`, `/notifications`, `/numbering`

Other groups follow the same shape: `/users`, `/roles`, `/procurement`, `/customers`, `/suppliers`, `/cash`, `/documents`, `/audit`, `/notifications`, `/ai`.

---

## API Rules

Every endpoint enforces, in this order: authentication → tenant isolation → permission check → input validation → (where applicable) audit logging. Errors are returned in a consistent shape:

```json
{
  "success": false,
  "message": "You do not have permission to approve this stock adjustment.",
  "code": "PERMISSION_DENIED"
}
```

_Current vs. target: the shipped auth routes return `{"error": "..."}` (see [backend/src/error.rs](../backend/src/error.rs)), simpler because there's no permission/tenant-isolation logic yet to report on. Adopt the fuller `{success, message, code}` shape when the first permission-gated endpoint is built, rather than reshaping the two existing auth errors now._

---

## Stock Transaction Rules

Stock must never change silently. Every stock-changing operation, in one transaction:

1. Create the `stock_movements` record
2. Update `stock_balances`
3. Link to the source document (purchase, sale, adjustment, transfer, ...)
4. Capture the acting user
5. Capture the workspace
6. Respect any applicable approval rule (see [Approval Architecture](#approval-architecture))
7. Write an audit log entry

## POS Transaction Rules

When a sale completes, in one transaction:

1. Create the sale
2. Create the sale items
3. Record the payment
4. Reduce stock (per the Stock Transaction Rules above)
5. Create the receipt
6. Update the active cash session
7. Update reporting aggregates (or queue them — see [Reporting Architecture](#reporting-architecture))
8. Write an audit log entry

---

## Background Jobs

Email sending, PDF generation, Excel import processing, report exports, low-stock alerts, scheduled analytics, temp-file cleanup, and [Data Quality Center](modules.md#bs-data-quality-center) checks — all belong on a worker, not the request path. See [Background Worker Service](architecture.md#platform--infrastructure-architecture).

---

## Reporting Architecture

Don't assume every report can be a live query forever:

- **Live queries** for small tenants / small date ranges.
- **Summary/aggregate tables** for large tenants where scanning raw transactions per request doesn't scale.
- **Background aggregation jobs** to keep those summary tables current.
- **An export queue** for large PDF/Excel/CSV downloads, so a big export doesn't block the request thread.

---

## Recommended Backend Folder Structure (target)

```
src/
  main.rs
  config/
  database/
  auth/
  tenants/
  users/
  roles/
  inventory/
  products/
  stock/
  procurement/
  sales/
  pos/
  reports/
  approvals/
  documents/
  notifications/
  settings/
  audit/
  workers/
  shared/
```

Each domain module gets its own `routes.rs`, `handlers.rs`, `service.rs`, `repository.rs`, `models.rs`, `dto.rs`, `validation.rs` — a layered structure (transport → business logic → data access) repeated per module, rather than one flat `routes/` and `models` dumping ground.

_Current vs. target: [backend/src/auth/](../backend/src/auth/) predates this convention and is organized by concern (`jwt.rs`, `password.rs`, `extractor.rs`) rather than by layer, because a single-endpoint-pair module doesn't need the full split. Adopt the `routes/handlers/service/repository/models/dto/validation` layout starting with the next module (likely `products/` or `tenants/`) once there's enough logic per layer to justify separate files — don't force-split `auth/` retroactively for consistency alone._
