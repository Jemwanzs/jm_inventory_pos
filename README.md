# Inventory Management + POS System

**Client:** James / JMS Kenya
**Project:** Multi-Tenant Inventory, Stock & Sales + POS Platform
**Approach:** Mobile-first, scalable, secure, configurable, multi-business SaaS

> This documentation is a living scope + architecture spec. It grows as scope is added. Every section is a build target, not a finished feature — see [Status](#status) for what's actually implemented.

---

## Status

| Area | Status |
|---|---|
| Scope definition | In progress |
| Backend scaffold | Auth slice working: super admin bootstrap, JWT login, forced password change, audit logging |
| Frontend scaffold | Expo app working: login → forced password change → home, wired to the backend API |
| Database schema | V1 auth-core tables migrated (`tenants`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `audit_logs`) |
| Deployment | Not started |

_Update this table as work lands — it's the fastest way for anyone (including future you) to see real progress vs. plan._

---

## 1. Product Overview

A complete multi-tenant Inventory Management and POS platform supporting different business types, including:

- Electronics shops
- Hardware stores
- Printing and branding businesses
- Hotels
- Restaurants
- Pubs and bars
- Retail stores
- General stock-based businesses

Each business configures its own workflows, stock rules, approval flows, product categories, pricing methods, sales settings, users, roles, workspaces, branches, and reporting structure.

The platform must be reliable for daily and hourly usage — stock movement, purchases, sales, receipts, invoices, payments, and reports are handled frequently and cannot be flaky. With the full scope in the [Core Modules catalog](docs/modules.md), this is no longer just an Inventory + POS tool — it's a configurable business operations platform that scales from a small shop to a multi-branch enterprise.

---

## 2. Technology Stack

### Frontend

**React Native** with:

- Expo or React Native CLI
- TypeScript
- React Navigation
- Zustand or Redux Toolkit for state management
- React Hook Form + Zod for forms and validation
- TanStack Query for API data fetching
- Mobile-first responsive layouts
- React Native Web for web/desktop support

Target surfaces: mobile phones, tablets, desktop web, POS counter devices.

### Backend

**Rust** with:

- Axum or Actix Web
- SQLx or SeaORM
- JWT-based authentication
- Role-based access control
- Background jobs for notifications and reports (see [Background Worker Service](docs/architecture.md#platform--infrastructure-architecture))
- REST API first, designed API-first so external integrations are a natural extension (see [Module Z](docs/modules.md#z-api--integrations-layer))

### Database

**PostgreSQL** as the primary datastore, plus:

- Redis for caching and session handling
- Object storage for documents and images
- PostgreSQL schemas or tenant IDs for multi-tenancy
- Audit log tables for every sensitive action
- Migrations via SQLx migrations or SeaORM migration tooling
- Logical schema separation by domain — see [Platform & Infrastructure Architecture](docs/architecture.md#platform--infrastructure-architecture)

### Storage

Object storage (AWS S3, Cloudflare R2, or MinIO for self-hosted) for:

- Product images
- Stock receipts
- Quotations / proformas
- Supplier documents
- Customer invoices
- Payment receipts
- Delivery notes
- Supporting attachments

---

## Documentation

The rest of the spec lives in `/docs` so each part stays a manageable size as scope keeps growing:

| Doc | Covers |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Multi-tenant structure, SaaS/subscription management, business setup wizard, access & user management, roles & permissions, sidebar navigation, platform & infrastructure architecture, security requirements, mobile-first UX |
| [docs/modules.md](docs/modules.md) | Full core module catalog (A–BT): dashboard, settings, product/stock/procurement/sales/customer/supplier management, documents, reports, and every extended module (variants, pricing, valuation, cash management, production, compliance, AI assistant, etc.) |
| [docs/database.md](docs/database.md) | Audit log requirements and the database table structure, grouped by domain schema |
| [docs/backend-architecture.md](docs/backend-architecture.md) | Backend service goals, field-level schemas for core tables, generic approval/documents architecture, REST API structure, stock/POS transaction rules, background jobs, reporting architecture, and target folder structure |
| [docs/ui-ux.md](docs/ui-ux.md) | Design system, mobile/tablet/desktop layout behavior, screen-by-screen UI spec, and cross-cutting UX controls (empty/loading/error states, audit trail panel, etc.) |
| [docs/screens.md](docs/screens.md) | Full screen inventory (~148 screens across 18 sidebar sections), route naming convention, and the per-screen contract (breadcrumbs, filters, states, permissions, audit impact) every screen must meet |
| [docs/roadmap.md](docs/roadmap.md) | V1 development priorities, recommended fast-follow priorities, future enhancements |

---

## Getting Started

### Repo layout

- `backend/` — Rust (Axum + SQLx) API
- `mobile/` — Expo (React Native + TypeScript) app
- `docs/` — scope and architecture specs (see [Documentation](#documentation))

### Backend

Requires Rust, PostgreSQL, and (on Windows) the MSVC C++ build tools.

```
cd backend
copy .env.example .env   # fill in DATABASE_URL, JWT_SECRET, SUPER_ADMIN_EMAIL
cargo install sqlx-cli --no-default-features --features rustls,postgres
sqlx migrate run
cargo run
```

On first startup, if no super admin exists yet, one is created from `SUPER_ADMIN_EMAIL` with a random temporary password printed to the log once — it must be changed via `/api/auth/change-password` on first login. Windows note: if `cargo build` fails to find `link.exe`, dot-source `backend/dev-env.ps1` first — Git Bash's own `link.exe` can shadow the real MSVC linker in `PATH`.

### Mobile

```
cd mobile
npm install
npx expo start
```

The app points at `http://localhost:8080/api` in development (`10.0.2.2` on the Android emulator, see `mobile/src/api/client.ts`).
