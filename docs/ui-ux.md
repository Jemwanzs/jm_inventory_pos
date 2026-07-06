← [README](../README.md) · [Architecture](architecture.md) · [Core Modules](modules.md) · [Database](database.md) · [Backend Architecture](backend-architecture.md) · [Screens](screens.md) · [Roadmap](roadmap.md) · [Deployment](deployment.md)

---

## UI Vision

A modern, clean, fast interface usable daily by business owners, cashiers, store managers, inventory teams, procurement teams, accountants, branch managers, and administrators. It must feel simple for a small shop but stay powerful for a multi-branch company.

Priorities: speed, minimum clicks, clean workflows, easy data entry, quick search, clear approvals, beautiful reporting, a strong mobile experience.

Every screen should answer three questions: **what happened, what needs attention, what can I do next.** The platform should feel like a business command center, not a data-entry form.

---

## Design System

A reusable component library that every module draws from, rather than each screen inventing its own controls:

Buttons, cards, inputs, dropdowns, search fields, tables, data grids, forms, modals, drawers, tabs, charts, upload components, timeline components, empty states, error states, loading skeletons, notification components.

Also: light/dark mode ready, and tenant branding support (logo, color, receipt theme) — the design system must accept a tenant's branding as theme input, not hardcoded colors.

---

## Layout Behavior

Mobile-first, scaling up through tablet to desktop (see [Section 12, Mobile-First UX](architecture.md#13-mobile-first-ux) for the underlying principle).

### Mobile
Bottom navigation: Home, POS, Inventory, Reports, More. A floating action button for quick-create (add sale, add stock, add customer, add product).

### Tablet
Collapsible sidebar over a main workspace area — optimized for POS counters, restaurants, and stock-taking sessions where the device is often propped up rather than held.

### Desktop
Left sidebar navigation that can expand or collapse, remembering the user's preference. Only one module's submenu expands at a time to avoid a wall of nested items.

---

## Screens

### Authentication
**Login** — email + password, with "forgot password." No public signup (see [Access and User Management](architecture.md#6-access-and-user-management)). Supports "remember device," session-expiry handling, and is MFA-ready.

### First-Login / Setup Wizard
On first tenant-admin login, show the [Business Setup Wizard](architecture.md#5-business-setup-wizard-first-time-configuration) with a visible progress indicator (e.g. "40% complete") rather than a flat form. See that section for the step list.

### Dashboard
Role-adaptive — a cashier's dashboard is not a business owner's dashboard. Cards: today's sales, current stock value, available products, low stock items, pending approvals, profit overview. Charts: sales trends, top products, branch comparison, stock movement. Quick actions: New Sale, Add Stock, Add Product, Purchase.

### Global Search
One search box, everywhere, with a `Ctrl+K` shortcut. A query like "Samsung" should return matches across products, customers, invoices, receipts, suppliers, documents, and stock history in one result list — see [Module AJ, Smart Search Engine](modules.md#aj-smart-search-engine).

### Inventory — Product Listing
Table view and card view. Each product card shows image, name, SKU, stock quantity, selling price, status, with actions to view, edit, adjust stock, transfer, or see history.

### Product Profile
Tabs: Overview, Stock, Pricing, Sales, Purchases, Documents, History. Shows product image, current quantity, value, locations, and recent activity.

### Stock Movement Timeline
Every product shows a chronological timeline, e.g. "Jan 5 — Purchased +100 units," "Jan 8 — Transferred Warehouse → Branch," "Jan 10 — Sold −5 units" — the UI surface for [Module O, Stock Lifecycle Tracking](modules.md#o-stock-lifecycle-tracking).

### Add Stock
A guided, multi-section form (supplier → products → quantities → cost → documents → approval) rather than one long flat form, with the option to save as draft or submit.

### POS
Optimized for speed: products on the left, cart on the right, with search and barcode entry along the top. Product cards show image, name, price, availability. Cart rows show item, quantity, discount, total. Actions: hold sale, cancel, checkout.

### Checkout
Amount due, payment method, amount received, balance/change. Methods: Cash, M-Pesa (manual), Bank, Card, Credit (see [Sales and POS](modules.md#f-sales-and-pos) — no payment gateway integration in V1). After payment: generate receipt, invoice, and an emailed copy.

### Restaurant POS Mode
Tables view, open bills, kitchen order tickets, waiters, split/merge bills, and order status (received → preparing → ready → served) — see [Module U](modules.md#u-restaurant--hospitality-mode) and [Module BL, Kitchen Display System](modules.md#bl-kitchen-display-system).

### Approval Center
One inbox, tabs: Pending, Approved, Rejected, My Requests. Each approval card shows request type, requester, date, and impact, with approve / reject / comment actions — see [Module V](modules.md#v-approval-inbox).

### Reports
Interactive, not static: filters (date, branch, user, product, category), charts, export buttons (PDF, Excel, CSV), and saved views.

### Analytics
Executive-level dashboards (sales intelligence, inventory intelligence, customer intelligence, employee activity) where a chart is clickable to drill into its underlying detail — e.g. clicking the low-stock card opens the list of products needing reorder.

### Settings
Card-based, not one giant form: Organization, Inventory, POS, Users, Roles, Approvals, Notifications, Templates, Integrations, Security, Audit.

### Roles & Permissions Matrix
Rows = modules (Products, Sales, Reports, ...), columns = actions (View, Create, Edit, Delete, Approve, Export), cells = checkboxes.

### Workflow Builder
Visual, drag-and-drop step builder for approval chains — e.g. a "Stock Adjustment" workflow with steps Store Manager → Finance → Director. Supports add/remove/reorder steps.

### Document Management
Every attachment supports preview, download, replace, and version history, across images, PDFs, Excel, and other documents.

### Notification Center
A bell icon opening a list of approvals, warnings, alerts, and tasks, each markable unread / read / completed.

### AI Assistant
A floating, configurably-named assistant that opens a side drawer. Responds to natural-language questions ("show today's sales," "why did stock reduce," "compare branches") with text, tables, charts, or reports — see [Module AA](modules.md#aa-ai-assistant-layer).

---

## UX Controls (cross-cutting)

These aren't screens on their own — they're behaviors every screen above must implement consistently via the design system:

- **Empty states** — never a blank screen; explain what's missing and offer the action to fix it (e.g. "No products yet" → **Add Product**).
- **Loading states** — skeletons, not spinners-only, for anything that takes more than an instant.
- **Error messages** — friendly and actionable ("Unable to save product. Please try again.") never a raw error code; full detail goes to developer logs, not the user.
- **Confirmation prompts** — before destructive or hard-to-reverse actions.
- **Breadcrumbs** — for anything nested more than one level deep.
- **Activity timeline / audit trail panel** — every record shows created by, updated by, approved by, what changed, and when — the UI surface for [Audit Logs](database.md#audit-logs).
- **Quick-create button** — a persistent shortcut into the most common "add" actions from anywhere.

---

## Performance Targets

- Screen load: under 2 seconds
- Search: instant (feels synchronous even if backed by an async index — see [Module AJ](modules.md#aj-smart-search-engine))
- POS checkout: under 5 seconds end-to-end
