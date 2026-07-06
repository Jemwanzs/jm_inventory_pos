← [README](../README.md) · [Architecture](architecture.md) · [Backend Architecture](backend-architecture.md) · [Roadmap](roadmap.md)

---

## Status

Backend is prepared to deploy on [Railway](https://railway.app) via Docker. Nothing is deployed yet — this doc is the checklist for the one-time setup, which needs your Railway account (I can't complete browser-based account/OAuth steps for you).

## Why Docker, not Railway's auto-detect

The backend uses `sqlx::query!`/`query_as!` macros, which normally need a live, migrated Postgres database *at compile time* to type-check queries. Railway's build step has no such database reachable. The fix is [SQLx's offline mode](https://docs.rs/sqlx/latest/sqlx/macro.query.html#offline-mode-requires-the-offline-feature): a `.sqlx/` directory of cached query metadata, generated locally via `cargo sqlx prepare` and checked into the repo, that `SQLX_OFFLINE=true` reads from instead of a live connection. `backend/Dockerfile` builds with this cache; regenerate it locally (`cargo sqlx prepare` from `backend/`, with a local Postgres reachable) whenever a query changes, and commit the updated `.sqlx/` alongside the code change.

## One-time Railway setup (manual, needs your account)

1. Create a Railway project, connect it to `Jemwanzs/jm_inventory_pos` on GitHub.
2. Add a **Postgres** plugin to the project — Railway provisions it and injects `DATABASE_URL` into linked services automatically.
3. Add a service for the backend:
   - **Root directory:** `backend` (this is a monorepo — Railway needs to know to build from the `backend/` subfolder, where `Dockerfile` and `railway.toml` live)
   - **Builder:** Dockerfile (auto-detected from `backend/railway.toml`)
4. Set these environment variables on the backend service (Railway's own `DATABASE_URL` from step 2 is injected automatically — don't override it):

   | Variable | Value |
   |---|---|
   | `JWT_SECRET` | A long random value — generate with `openssl rand -hex 32`, don't reuse the local dev one |
   | `SUPER_ADMIN_EMAIL` | The real super admin's email for this environment |
   | `RESEND_API_KEY` | From resend.com |
   | `EMAIL_FROM` | A verified sender/domain in Resend, or `onboarding@resend.dev` for early testing |
   | `RUST_LOG` | `inventory_pos_api=info,tower_http=info` (or `debug` while stabilizing) |

   `PORT` is injected by Railway automatically — the app already reads it from the environment, don't set it manually.
5. Deploy. Railway builds the Dockerfile, runs the binary, which applies migrations on startup (`sqlx::migrate!`) and bootstraps the super admin if none exists yet — check the deploy logs for the one-time temporary password, same as local dev.

## What's not covered yet

- **Mobile/web frontend hosting** — the Expo app isn't deployed anywhere yet (this doc is backend-only). Static web export + a second Railway/Vercel service is a follow-up once there's more to show.
- **Auto-deploy on push** — once the service above exists and is connected to the GitHub repo, Railway deploys automatically on every push to `master` by default; no extra config needed.
- **Object storage** (S3/R2/MinIO for documents/images — see [Storage](../README.md#storage)) — not wired up yet; add when the Documents module is built.
