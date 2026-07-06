← [README](../README.md) · [Architecture](architecture.md) · [Core Modules](modules.md) · [Database](database.md) · [Backend Architecture](backend-architecture.md) · [UI/UX](ui-ux.md) · [Roadmap](roadmap.md)

---

## Purpose

[docs/modules.md](modules.md) catalogs *what the platform does* (72 functional modules, A–BT). This doc catalogs *what the user actually clicks through* — the concrete screen inventory behind each sidebar item in [Application Navigation](architecture.md#8-application-navigation-sidebar-architecture), so frontend work has a checklist instead of an open-ended "build the Products module."

~148 screens across 18 sidebar sections. Every screen listed here is a **target**, not a build status — see [README status](../README.md#status) for what's actually live. Today, [Module BT-equivalent] only the app shell, Dashboard (with mock stats), and empty-state placeholders for every other item exist (see `mobile/src/navigation/modules.ts`).

---

## Route naming convention

```
/dashboard/executive
/products
/products/create
/products/:id/overview
/inventory/stock-balances
/pos/terminal
/sales/invoices
/settings/roles-permissions
```

Pattern: `/<module-kebab>/<screen-kebab>`, with `/:id/<tab>` for a record's sub-tabs (mirrors the tabbed profile screens below — Product, Supplier, Customer).

---

## Every screen's contract

Regardless of module, a screen isn't done until it has:

- Page title
- Breadcrumbs (for anything nested more than one level)
- Search, where the list can grow unbounded
- Filters, where more than ~2 dimensions matter
- A primary action button
- An export button, if the data is reportable
- Empty state, loading state, error state (see [UX Controls](ui-ux.md#ux-controls-cross-cutting))
- A permission check gating access
- Audit impact where the screen writes data (see [Audit Logs](database.md#10-audit-logs))

And every module must respect: `tenant_id`, `workspace_id`, user permissions, role access, applicable approval rules, and audit logging — the same rule already stated in [V1 priorities](roadmap.md) and [the backend's final principle](backend-architecture.md#stock-transaction-rules).

---

## 1. Dashboard (5)

| Screen | Purpose |
|---|---|
| Executive Dashboard | Today's/monthly sales, stock value, profit summary, pending approvals, low stock alerts, branch performance, quick actions |
| Sales Dashboard | Daily sales trend, cashier performance, payment-method breakdown, top sellers, period comparison |
| Inventory Dashboard | Stock balance summary, low/out-of-stock items, movement trends, slow-moving stock |
| Branch / Workspace Dashboard | Branch-level performance, sales by workspace, stock by warehouse/store, user activity per branch |
| Alerts Dashboard | Low stock, approval, cash variance, expiry, and suspicious-activity alerts in one feed |

## 2. Products (11)

| Screen | Purpose |
|---|---|
| Product List | Search/filter by category, brand, branch, status; table and card view; export |
| Add Product | Name, SKU/barcode, category, brand, unit, image, cost/selling price, tax, stock-tracking options |
| Product Profile | Tabs: Overview, Stock, Pricing, Sales, Purchases, Documents, History (see [Module K](modules.md#k-product-variants)) |
| Product Variants | Size/color/capacity/packaging variants with variant-level SKU, pricing, and stock |
| Categories | Add/edit categories, parent category, activate/deactivate |
| Brands | Add/edit brands, link to products |
| Units of Measure | Add units and conversions — buy in one unit, sell in another (see [Module AT](modules.md#at-multi-unit-conversion)) |
| Price Lists | Retail, wholesale, customer-specific, branch-specific, and promotional pricing (see [Module L](modules.md#l-advanced-pricing-engine)) |
| Barcode / QR Codes | Generate and print barcode/QR labels; link a scanner to a product (see [Module AL](modules.md#al-barcode--label-printing)) |
| Product Import | Download template, upload, validate rows, show failures, confirm before import |
| Product Settings | Required fields, SKU format, variant rules, approval rules, numbering rules |

## 3. Inventory (13)

| Screen | Purpose |
|---|---|
| Stock Balances | Current stock by branch/store/warehouse; available/reserved/damaged/expired; export |
| Stock Movements | Full in/out ledger, filterable by product/date/user/branch |
| Opening Stock | First stock entry, bulk upload, document attachment, approval if required |
| Add Stock | Purchased stock entry: supplier, quantity, cost, receipt upload, approval-gated update |
| Stock Adjustments | Increase/reduce with reason, evidence, approval workflow, audit trail |
| Stock Transfers | Branch-to-branch dispatch/receive with in-transit tracking and approval |
| Stock Reservations | Reserve for a customer order, release, or convert to sale (see [Module N](modules.md#n-stock-reservation--holding)) |
| Stock Counts | Physical count sessions, blind-count option, expected-vs-counted variance, reconciliation approval |
| Damaged Stock | Record damage with photos; decide repair, return, or write-off |
| Expired Stock | Track expiries, alert before expiry, remove from sellable stock |
| Stock Write-Offs | Write off with reason, required approval, audit trail |
| Stock Valuation | FIFO / weighted average / last purchase cost, closing value, COGS (see [Module M](modules.md#m-inventory-valuation-engine)) |
| Inventory Settings | Negative-stock policy, low-stock thresholds, batch/serial/expiry tracking, valuation method |

## 4. Procurement (8)

| Screen | Purpose |
|---|---|
| Purchase Requests | Create and submit for approval |
| Purchase Orders | Create PO, link supplier, add products/costs, print/download |
| Goods Received Notes | Receive goods, compare ordered vs. received, update inventory |
| Supplier Invoices | Capture invoice, attach document, track status |
| Purchase Returns | Return to supplier, adjust stock, track refund/replacement |
| Procurement Approvals | Approve/reject requests and POs with comments |
| Purchase Reports | By supplier, by product, cost trend, outstanding supplier invoices |
| Procurement Settings | PO numbering, approval rules, required supplier documents |

## 5. Suppliers (5)

| Screen | Purpose |
|---|---|
| Supplier List | Search, filter, status |
| Add Supplier | Name, contact person, phone/email, address, payment terms |
| Supplier Profile | Tabs: Overview, Purchases, Invoices, Payments, Documents |
| Supplier Documents | Contracts, invoices, compliance documents |
| Supplier Reports | Purchase history, balance, performance |

## 6. POS & Sales (15)

| Screen | Purpose |
|---|---|
| POS Terminal | Search, barcode scan, product grid, cart, discounts, checkout, receipt (see [UI/UX POS screen](ui-ux.md#pos)) |
| Held Sales | Hold, resume, cancel a held sale |
| Sales List | Filter by date/branch/cashier/customer |
| Sale Details | Items sold, payment detail, receipt/invoice, refund/return entry point |
| Quotations | Create, convert to invoice/sale, PDF |
| Proformas | Create, convert to invoice, status tracking |
| Invoices | Create, track paid/unpaid/partial, PDF |
| Receipts | View, reprint, email |
| Payments | Record manual payment (cash/M-Pesa/card/bank/credit), partial payments |
| Returns | Customer returns with reason; return to stock/damage/write-off |
| Refunds | Process with approval workflow, track refund method |
| Discounts | Rules, approval, history |
| Credit Sales | Sell on credit, track balance, credit limit, payment terms (see [Module P](modules.md#p-customer-credit-management)) |
| Sales Reports | Daily/monthly, by product, by cashier, by branch |
| POS Settings | Receipt format, payment methods, discount limits, tax display, cashier rules, shift-closure rules |

## 7. Customers (6)

| Screen | Purpose |
|---|---|
| Customer List | Search, filter, status |
| Add Customer | Name, phone/email, address, group, credit limit |
| Customer Profile | Tabs: Overview, Sales, Invoices, Payments, Documents, Credit |
| Customer Credit | Outstanding balance, credit limit, aging report, payment history |
| Customer Documents | Upload and link to sales/invoices |
| Customer Reports | Sales history, outstanding balances, top customers |

## 8. Cash Management (7)

| Screen | Purpose |
|---|---|
| Cash Sessions | Open/closed shifts by cashier/branch/date |
| Open Shift | Opening float, assign cashier and counter |
| Close Shift | Expected vs. actual cash, variance, supervisor approval |
| Cash Movements | Cash in/out, petty cash, expense recording |
| Cash Variance | Shortages/excess with explanation notes and approval |
| Shift Handover Notes | Pending issues, complaints, cash/stock notes (see [Module AZ](modules.md#az-shift-handover-notes)) |
| Cash Reports | Cashier report, variance report, daily summary |

## 9. Production / Recipes (7)

| Screen | Purpose |
|---|---|
| Recipes / BOM | Define raw materials and output quantity |
| Production Orders | Consume raw stock, add finished goods |
| Wastage | Record with reason and photo |
| Finished Goods | Track completed production into inventory |
| Ingredient Stock | Raw material levels, low-stock alerts |
| Production Reports | Cost, wastage, finished-goods reports |
| Production Settings | Auto-deduct ingredients, wastage approvals, recipe costing rules |

## 10. Approvals (6)

| Screen | Purpose |
|---|---|
| Pending Approvals | Everything awaiting the current user; approve/reject with comments |
| My Requests | Requests the user submitted, with status |
| Approved Requests | History, filterable by module/date/user |
| Rejected Requests | Rejection reason, resubmit where allowed |
| Approval Workflows | List of configured workflows by module |
| Workflow Builder | Drag-and-drop steps, role/user approver, maker-checker, delegation (see [UI/UX Workflow Builder](ui-ux.md#workflow-builder)) |

## 11. Documents (5)

| Screen | Purpose |
|---|---|
| Document Library | Search, filter, preview/download across all uploads |
| Upload Document | Select linked module, add description |
| Document Details | Preview, download, linked records, version history |
| Document Templates | Receipt, invoice, quotation, PO templates (see [Module AM](modules.md#am-document-template-designer)) |
| Document Settings | File size limits, allowed types, retention rules |

## 12. Tasks (5)

| Screen | Purpose |
|---|---|
| Task Board | Kanban: To Do / In Progress / Done |
| My Tasks | Assigned tasks with due date and priority |
| Create Task | Assign user, due date, link to a product/sale/stock issue |
| Task Details | Comments, attachments, status updates |
| Task Reports | Overdue, completed, user productivity |

## 13. Reports & Analytics (12)

| Screen | Purpose |
|---|---|
| Reports Home | Categories, saved reports, recent exports |
| Sales Reports | Daily/monthly, by product, by cashier, by branch |
| Inventory Reports | Stock balance, movement, low/out-of-stock |
| Stock Valuation Reports | Closing value, COGS, FIFO/weighted average |
| Procurement Reports | Purchases, supplier invoices, purchase returns |
| Customer Reports | Sales, credit, balances |
| Supplier Reports | Purchases, balances |
| Cash Reports | Cashier summary, variance, payment-method breakdown |
| Profit Reports | Gross profit, product margin, branch margin |
| Audit Reports | User activity, settings changes, transaction changes |
| Analytics Dashboard | Charts, trends, KPIs, drill-down views |
| Export Center | PDF/Excel/CSV exports and export history |

## 14. Data Quality Center (5)

| Screen | Purpose |
|---|---|
| Data Quality Dashboard | Missing-data count, risky records, abnormal records overview |
| Missing Product Data | Products without cost, SKU, or category |
| Stock Exceptions | Negative stock, unmatched stock, duplicate SKUs |
| Sales Exceptions | Sales without payment, unusual discounts, excessive refunds |
| Fix Center | Suggested corrections, bulk fixes, assign an issue to a user |

See [Module BS](modules.md#bs-data-quality-center).

## 15. AI Assistant (4)

| Screen | Purpose |
|---|---|
| AI Chat | Ask business questions, get answers from reports/data |
| AI Insights | Suggested actions, risk alerts, performance insights |
| AI Report Builder | Generate a report from a prompt, export the output |
| AI Settings | Enable/disable, allowed data access, assistant name |

See [Module AA](modules.md#aa-ai-assistant-layer) and [Module BT](modules.md#bt-ai-assisted-configuration).

## 16. Integrations (6)

| Screen | Purpose |
|---|---|
| Integrations Home | Available integrations, connected systems |
| API Keys | Create, revoke, track usage |
| Webhooks | Add URL, select event triggers |
| Import Jobs | Track bulk imports, view success/failure rows |
| Export Jobs | Track report exports, download generated files |
| Integration Logs | Failed/success logs, retry option |

See [Module Z](modules.md#z-api--integrations-layer).

## 17. Administration (9)

| Screen | Purpose |
|---|---|
| Tenants | Create business tenant, activate/suspend, view usage |
| Tenant Profile | Business details, enabled modules, users, subscription status |
| Subscription Plans | Create plan, module/user/storage limits |
| Module Management | Enable/disable modules per tenant, feature flags |
| Platform Users | Super admin and support users, access control |
| System Health | API status, worker status, storage usage, failed jobs |
| Audit Overview | Platform-level audit logs, tenant activity |
| Backup & Restore | Tenant backups, restore points, data export |
| Platform Settings | Global, email, and security settings |

This is the **Super Admin Portal** — see [SaaS Platform & Subscription Management](architecture.md#4-saas-platform--subscription-management). Nothing here exists yet (no tenant-creation UI or API), and it's the natural next slice after the current auth-only build — see the "Do we have robust signup" note in project history.

## 18. Settings (14)

| Screen | Purpose |
|---|---|
| Business Profile | Name, logo, contacts, address, currency |
| Workspaces | Branches, stores, warehouses, POS counters |
| Users | Create, edit, deactivate, reset password |
| Roles & Permissions | Permission matrix, module access, workspace access (see [UI/UX Roles Matrix](ui-ux.md#roles--permissions-matrix)) |
| Inventory Settings | Stock rules, tracking rules, valuation method, low-stock alerts |
| POS Settings | Payment methods, receipt setup, discount rules, shift-closure rules |
| Numbering Settings | Product, receipt, invoice, PO, quotation numbers (see [Module AC](modules.md#ac-custom-numbering-engine)) |
| Approval Settings | Workflow rules, approval levels, delegation |
| Notification Settings | Email/in-app alerts, rule-based notifications (see [Module AG](modules.md#ag-advanced-notification-rules-builder)) |
| Tax Settings | Tax rates, tax-inclusive pricing, tax display |
| Custom Fields | Field types, applied to products/customers/suppliers/sales (see [Module AB](modules.md#ab-dynamic-custom-fields-engine)) |
| Templates | Receipt, invoice, quotation, email templates |
| Security Settings | Password rules, session timeout, MFA readiness |
| Audit Logs | Business audit logs, filter by user/module/action, export |

---

## Total

**~148 screens** across 18 sidebar sections (Dashboard 5, Products 11, Inventory 13, Procurement 8, Suppliers 5, POS & Sales 15, Customers 6, Cash Management 7, Production/Recipes 7, Approvals 6, Documents 5, Tasks 5, Reports & Analytics 12, Data Quality Center 5, AI Assistant 4, Integrations 6, Administration 9, Settings 14).

This is a target inventory, sequenced by [V1 priorities and fast-follow priorities](roadmap.md) — not a build order. Build the screen when its module comes up in the roadmap, not before.
