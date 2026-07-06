use serde_json::json;

const RESEND_ENDPOINT: &str = "https://api.resend.com/emails";

/// Thin wrapper over the Resend API. If no API key is configured, sends are
/// logged instead of delivered — lets the rest of the app call `send`
/// unconditionally without every caller checking whether email is set up.
#[derive(Clone)]
pub struct EmailClient {
    api_key: Option<String>,
    from: String,
    http: reqwest::Client,
}

impl EmailClient {
    pub fn new(api_key: Option<String>, from: String) -> Self {
        Self {
            api_key,
            from,
            http: reqwest::Client::new(),
        }
    }

    pub async fn send(&self, to: &str, subject: &str, html: &str) -> anyhow::Result<()> {
        let Some(api_key) = &self.api_key else {
            tracing::info!(%to, %subject, "RESEND_API_KEY not set; email logged instead of sent");
            return Ok(());
        };

        let response = self
            .http
            .post(RESEND_ENDPOINT)
            .bearer_auth(api_key)
            .json(&json!({
                "from": self.from,
                "to": [to],
                "subject": subject,
                "html": html,
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            anyhow::bail!("resend request failed ({status}): {body}");
        }

        Ok(())
    }
}
