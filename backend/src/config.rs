use std::env;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
    pub super_admin_email: String,
    pub resend_api_key: Option<String>,
    pub email_from: String,
    pub app_base_url: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            database_url: env::var("DATABASE_URL")?,
            jwt_secret: env::var("JWT_SECRET")?,
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()?,
            super_admin_email: env::var("SUPER_ADMIN_EMAIL")?,
            resend_api_key: env::var("RESEND_API_KEY").ok().filter(|key| !key.is_empty()),
            email_from: env::var("EMAIL_FROM").unwrap_or_else(|_| "onboarding@resend.dev".to_string()),
            app_base_url: env::var("APP_BASE_URL").unwrap_or_else(|_| "http://localhost:19010".to_string()),
        })
    }
}
