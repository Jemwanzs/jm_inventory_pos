mod audit;
mod auth;
mod bootstrap;
mod config;
mod email;
mod error;
mod routes;
mod state;

use std::sync::Arc;

use sqlx::postgres::PgPoolOptions;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

use config::Config;
use email::EmailClient;
use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let config = Config::from_env()?;

    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    sqlx::migrate!("./migrations").run(&db).await?;

    bootstrap::ensure_super_admin(&db, &config.super_admin_email).await?;

    let email = EmailClient::new(config.resend_api_key.clone(), config.email_from.clone());

    let state = AppState {
        db,
        config: Arc::new(config.clone()),
        email,
    };

    let app = routes::router()
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.port);
    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
