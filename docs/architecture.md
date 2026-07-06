← [README](../README.md) · [Core Modules](modules.md) · [Database](database.md) · [Backend Architecture](backend-architecture.md) · [UI/UX](ui-ux.md) · [Roadmap](roadmap.md)

---

## 3. Multi-Tenant Structure

Each tenant/business has its own:

- Business profile, logo, branding
- Currency and tax settings
- Workspaces, branches, stores, warehouses
- Users, roles, and permissions
- Stock workflows
- POS settings
- Reporting structure

A tenant can have multiple workspaces (e.g. main shop, branch shop, warehouse, restaurant floor, bar counter, online sales unit, printing production unit). Each workspace reports independently but rolls up to the main admin dashboard.

---

## 4. SaaS Platform & Subscription Management

A platform-management layer sitting above individual tenants, run by the super admin.

**Super Admin Portal capabilities:**

- Create, suspend, and activate tenant/business accounts
- Manage subscription plans (e.g. Starter, Business, Enterprise)
- Control which modules are enabled per tenant
- Define per-tenant limits: users, storage, branches/workspaces
- View tenant usage analytics

**Per-tenant module toggles** — each tenant only sees/pays for what's enabled. Example:

| Module | Tenant A | Tenant B |
|---|---|---|
| Inventory | ✅ | ✅ |
| POS | ✅ | ✅ |
| Procurement | ❌ | ✅ |
| Analytics | ❌ | ✅ |

This means the codebase must treat modules as addressable/toggleable units, not a monolith every tenant gets in full — relevant to both backend authorization checks and frontend navigation rendering.

---

## 5. Business Setup Wizard (First-Time Configuration)

Because the platform is so configurable, a new tenant should never be dropped into empty settings. A guided onboarding wizard walks the tenant admin through setup on first login.

1. **Business Profile** — name and industry type (Retail, Restaurant, Hardware, Electronics, Manufacturing, Services, ...). Industry selection pre-suggests configuration:
   - *Restaurant* → enable tables, kitchen orders, recipes, waiters, service charge
   - *Electronics* → enable serial numbers, warranty, IMEI tracking
2. **Business Structure** — create branches, stores, warehouses, departments, counters
3. **Inventory Preferences** — product numbering, stock valuation method, stock approval rules, stock alerts, negative stock policy
4. **POS Setup** — receipt format, payment methods, cashier rules, sales taxes, returns
5. **Users and Roles** — create managers, cashiers, store users, approvers
6. **Opening Stock Import** — bulk-load starting inventory via [Module X, Data Import & Migration Center](modules.md#x-data-import--migration-center) rather than manual entry
7. **Review and Go Live** — a final summary of everything configured before the tenant starts transacting

Show a visible progress indicator (e.g. "40% complete") through these steps rather than presenting them as a flat, ungrounded form — see [First-Login / Setup Wizard](ui-ux.md#first-login--setup-wizard) for the UI treatment.

**Industry Templates / Presets** — at step 1, the industry choice (Retail, Electronics, Hardware, Restaurant, Bar, Hotel, Pharmacy, Printing, Wholesale, Distribution, ...) can map to a full preset bundle, not just suggestions: the matching modules, custom fields, workflows, reports, and POS layout are enabled automatically. This turns the wizard from a checklist into a real accelerator for onboarding a new tenant.

The wizard is a UX flow over existing settings/modules ([Settings and Configuration](modules.md#b-settings-and-configuration), [Section 4](#4-saas-platform--subscription-management)) — it doesn't need its own data model beyond tracking onboarding completion state and the applied preset per tenant.

---

## 6. Access and User Management

**No public signup.** All businesses and users are created by the system owner/super admin.

Super admin bootstrapping:

- Super admin email configured via environment variables
- Temporary password generated during deployment (never hardcoded)
- Forced password change on first login
- Password reset via email
- MFA-ready
- Super admin email/password updatable securely

**Super admin can:**
- Create businesses/tenants and tenant admins
- Activate/deactivate businesses
- Manage subscriptions/plans and per-tenant module access (see [Section 4](#4-saas-platform--subscription-management))
- View platform-level analytics and audit logs
- Configure system-wide settings

**Tenant admin can:**
- Create users, assign roles, create workspaces
- Configure inventory and POS settings
- Manage reports, approve workflows, manage business documents

---

## 7. Roles and Permissions

Permissions support: View, Create, Edit, Delete, Approve, Export, Upload, Download, Manage settings.

Example roles: Super Admin, Tenant Admin, Branch Manager, Store Manager, Inventory Officer, Cashier, Sales Agent, Accountant, Procurement Officer, Auditor, Viewer.

Permissions are assignable by module, workspace, branch, store, user role, or specific user.

Sensitive actions additionally enforce **maker-checker** — see [Module AF](modules.md#af-maker-checker-controls).

---

## 8. Application Navigation (Sidebar Architecture)

Proposed top-level navigation for the tenant-facing app:

- Dashboard
- Inventory Management
- Product Management
- Stock Operations
- Procurement
- Suppliers
- POS & Sales
- Customers
- Cash Management
- Production / Recipes
- Documents
- Tasks
- Approvals Center
- Notifications
- Reports & Analytics
- AI Business Assistant
- Integrations
- Administration
- Settings

Since modules are toggleable per tenant ([Section 4](#4-saas-platform--subscription-management)) and permission-gated per role ([Section 7](#7-roles-and-permissions)), the sidebar itself must be built dynamically from the current user's enabled modules + permissions, not hardcoded.

---

## Platform & Infrastructure Architecture

Cross-cutting technical decisions that support the full [module catalog](modules.md) at scale.

**Schema separation** — avoid one giant database schema; group tables by domain (core, inventory, procurement, sales, finance, workflow, documents, audit, settings) — see [Backend Architecture: Database Organized by Domain](backend-architecture.md#database-organized-by-domain) for the full breakdown.

**Event-driven architecture** — domain events fan out to independent handlers instead of one monolithic transaction. E.g. "Sale Completed" fires: reduce stock, generate receipt, update reports, notify manager, update analytics. Recommended messaging layer: NATS, Kafka, or RabbitMQ alongside the Rust backend.

**Background Worker Service** — a separate process/queue for heavy async work (PDF generation, report generation, email sending, data imports, analytics processing) so the request path stays fast.

**System Health Monitoring** (super admin view) — active businesses, API performance, failed jobs, database usage, storage usage, error logs, login activity.

---

## 12. Security Requirements

- Secure login, hashed passwords, password reset
- JWT access tokens + refresh tokens, with session expiry handling
- Role-based access control
- Maker-checker enforcement on sensitive actions ([Module AF](modules.md#af-maker-checker-controls))
- Tenant data isolation
- Input validation, file upload validation
- Audit logs, rate limiting
- Secure environment variables, no hardcoded credentials
- MFA-ready

---

## 13. Mobile-First UX

Priority screens: Login, Dashboard, Product list, Add product, Stock entry, POS screen, Sales checkout, Reports, Approval inbox, Settings.

Design principles: fast loading, simple navigation, large touch-friendly buttons, clear forms, quick search, barcode-ready flow, offline-ready POS consideration (see [Module AK](modules.md#ak-offline-mode-architecture)), smooth tablet/desktop experience.

Full screen-by-screen UI spec, design system, and layout behavior across mobile/tablet/desktop now live in **[docs/ui-ux.md](ui-ux.md)** — this section stays as the one-paragraph summary.
