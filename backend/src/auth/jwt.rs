use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,
    pub tenant_id: Option<Uuid>,
    pub must_change_password: bool,
    pub exp: usize,
}

pub fn issue_token(
    user_id: Uuid,
    tenant_id: Option<Uuid>,
    must_change_password: bool,
    secret: &str,
) -> Result<String, AppError> {
    let claims = Claims {
        sub: user_id,
        tenant_id,
        must_change_password,
        exp: (Utc::now() + Duration::hours(12)).timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|err| AppError::Internal(anyhow::anyhow!("failed to issue token: {err}")))
}

pub fn decode_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized)
}
