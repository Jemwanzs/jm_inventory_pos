# Multi-stage build. SQLX_OFFLINE=true makes `cargo build` use the
# checked-in .sqlx/ query cache instead of connecting to a live database
# (there isn't one reachable at build time on Railway) — regenerate that
# cache locally with `cargo sqlx prepare` whenever a query changes.
FROM rust:1-slim-bookworm AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
COPY .sqlx ./.sqlx
COPY migrations ./migrations
COPY src ./src

ENV SQLX_OFFLINE=true
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

# sqlx::migrate! embeds the migrations directory into the binary at compile
# time, so nothing from ./migrations needs to be copied into this image.
COPY --from=builder /app/target/release/inventory_pos_api ./inventory_pos_api

CMD ["./inventory_pos_api"]
