use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{NaiveDate, Utc, DateTime};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{audit, auth::extractor::AuthUser, error::AppError, state::AppState, tenant::resolve_tenant_id};

const STATUSES: &[&str] = &["To Do", "In Progress", "Done"];
const PRIORITIES: &[&str] = &["Low", "Medium", "High"];

#[derive(Serialize)]
pub struct TaskResponse {
    id: Uuid,
    title: String,
    description: Option<String>,
    status: String,
    priority: String,
    assigned_to_email: Option<String>,
    due_date: Option<NaiveDate>,
    created_at: DateTime<Utc>,
}

pub async fn list_tasks(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<TaskResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let tasks = sqlx::query_as!(
        TaskResponse,
        r#"
        SELECT
            t.id, t.title, t.description, t.status, t.priority,
            u.email AS "assigned_to_email?",
            t.due_date, t.created_at
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        WHERE t.tenant_id = $1
        ORDER BY t.created_at DESC
        "#,
        tenant_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(tasks))
}

pub async fn list_my_tasks(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<Vec<TaskResponse>>, AppError> {
    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let tasks = sqlx::query_as!(
        TaskResponse,
        r#"
        SELECT
            t.id, t.title, t.description, t.status, t.priority,
            u.email AS "assigned_to_email?",
            t.due_date, t.created_at
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        WHERE t.tenant_id = $1 AND t.assigned_to = $2
        ORDER BY t.due_date NULLS LAST, t.created_at DESC
        "#,
        tenant_id,
        auth_user.user_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(tasks))
}

#[derive(Deserialize)]
pub struct CreateTaskRequest {
    title: String,
    description: Option<String>,
    priority: Option<String>,
    assigned_to: Option<Uuid>,
    due_date: Option<NaiveDate>,
}

pub async fn create_task(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateTaskRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.title.trim().is_empty() {
        return Err(AppError::Validation("title is required".to_string()));
    }
    let priority = req.priority.unwrap_or_else(|| "Medium".to_string());
    if !PRIORITIES.contains(&priority.as_str()) {
        return Err(AppError::Validation(format!("unknown priority '{priority}'")));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let id = sqlx::query_scalar!(
        r#"
        INSERT INTO tasks (tenant_id, title, description, priority, assigned_to, due_date, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#,
        tenant_id,
        req.title.trim(),
        req.description.as_deref(),
        priority,
        req.assigned_to,
        req.due_date,
        auth_user.user_id
    )
    .fetch_one(&state.db)
    .await?;

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "create_task", "tasks")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "id": id })))
}

#[derive(Deserialize)]
pub struct UpdateTaskStatusRequest {
    status: String,
}

pub async fn update_task_status(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateTaskStatusRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if !STATUSES.contains(&req.status.as_str()) {
        return Err(AppError::Validation(format!("unknown status '{}'", req.status)));
    }

    let tenant_id = resolve_tenant_id(&state.db, &auth_user).await?;

    let updated = sqlx::query!(
        "UPDATE tasks SET status = $3, updated_at = now() WHERE id = $1 AND tenant_id = $2",
        id,
        tenant_id,
        req.status
    )
    .execute(&state.db)
    .await?;

    if updated.rows_affected() == 0 {
        return Err(AppError::Validation("task not found".to_string()));
    }

    audit::record(&state.db, Some(tenant_id), Some(auth_user.user_id), "update_task_status", "tasks")
        .await
        .map_err(AppError::Internal)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}
