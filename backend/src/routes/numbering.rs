use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

const DOCUMENT_TYPES: &[&str] = &["product", "invoice", "receipt", "purchase_order", "quotation"];

#[derive(Serialize)]
pub struct NumberingSequenceResponse {
    document_type: String,
    prefix: String,
    include_year: bool,
    include_month: bool,
    sequence_length: i32,
    separator: String,
    next_number: i32,
}

pub async fn list_numbering(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<NumberingSequenceResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let existing_count = sqlx::query_scalar!(
        r#"SELECT COUNT(*) as "count!" FROM numbering_sequences WHERE tenant_id = $1"#,
        tenant_id
    )
    .fetch_one(&state.db)
    .await?;

    if existing_count == 0 {
        for document_type in DOCUMENT_TYPES {
            sqlx::query!(
                r#"
                INSERT INTO numbering_sequences (tenant_id, document_type)
                VALUES ($1, $2)
                ON CONFLICT (tenant_id, document_type) DO NOTHING
                "#,
                tenant_id,
                *document_type
            )
            .execute(&state.db)
            .await?;
        }
    }

    let sequences = sqlx::query_as!(
        NumberingSequenceResponse,
        r#"
        SELECT document_type, prefix, include_year, include_month, sequence_length, separator, next_number
        FROM numbering_sequences
        WHERE tenant_id = $1
        ORDER BY document_type
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(sequences))
}

#[derive(Deserialize)]
pub struct UpdateNumberingRequest {
    prefix: String,
    include_year: bool,
    include_month: bool,
    sequence_length: i32,
    separator: String,
}

pub async fn update_numbering(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(document_type): Path<String>,
    Json(req): Json<UpdateNumberingRequest>,
) -> Result<Json<NumberingSequenceResponse>, AppError> {
    if !DOCUMENT_TYPES.contains(&document_type.as_str()) {
        return Err(AppError::Validation(format!("unknown document type '{document_type}'")));
    }
    if req.sequence_length < 1 || req.sequence_length > 10 {
        return Err(AppError::Validation("sequence length must be between 1 and 10".to_string()));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let sequence = sqlx::query_as!(
        NumberingSequenceResponse,
        r#"
        INSERT INTO numbering_sequences
            (tenant_id, document_type, prefix, include_year, include_month, sequence_length, separator, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (tenant_id, document_type) DO UPDATE SET
            prefix = EXCLUDED.prefix,
            include_year = EXCLUDED.include_year,
            include_month = EXCLUDED.include_month,
            sequence_length = EXCLUDED.sequence_length,
            separator = EXCLUDED.separator,
            updated_by = EXCLUDED.updated_by,
            updated_at = now()
        RETURNING document_type, prefix, include_year, include_month, sequence_length, separator, next_number
        "#,
        tenant_id,
        document_type,
        req.prefix.trim(),
        req.include_year,
        req.include_month,
        req.sequence_length,
        req.separator.trim(),
        auth_user.user_id
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(
        &state.db,
        Some(tenant_id),
        Some(auth_user.user_id),
        "update_numbering",
        "settings.numbering",
    )
    .await
    .map_err(AppError::Internal)?;

    Ok(Json(sequence))
}
