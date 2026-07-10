mod audit_logs;
mod auth;
mod cash;
mod catalog;
mod custom_fields;
mod customers;
mod dashboard;
mod health;
mod invites;
mod numbering;
mod procurement;
mod products;
mod roles;
mod settings;
mod stock;
mod suppliers;
mod workspaces;

use axum::{
    routing::{get, post},
    Router,
};

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/health", get(health::health))
        .route("/api/dashboard/summary", get(dashboard::get_summary))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/change-password", post(auth::change_password))
        .route("/api/invites", post(invites::create_invite))
        .route("/api/invites/{token}", get(invites::get_invite))
        .route("/api/invites/{token}/accept", post(invites::accept_invite))
        .route(
            "/api/settings/numbering",
            get(numbering::list_numbering),
        )
        .route(
            "/api/settings/numbering/{document_type}",
            axum::routing::put(numbering::update_numbering),
        )
        .route(
            "/api/settings/{category}",
            get(settings::get_settings).put(settings::put_settings),
        )
        .route(
            "/api/workspaces",
            get(workspaces::list_workspaces).post(workspaces::create_workspace),
        )
        .route(
            "/api/workspaces/{id}",
            axum::routing::patch(workspaces::update_workspace),
        )
        .route("/api/audit-logs", get(audit_logs::list_audit_logs))
        .route(
            "/api/custom-fields",
            get(custom_fields::list_custom_fields).post(custom_fields::create_custom_field),
        )
        .route(
            "/api/custom-fields/{id}",
            axum::routing::patch(custom_fields::update_custom_field),
        )
        .route("/api/roles-matrix", get(roles::get_roles_matrix))
        .route(
            "/api/roles/{role_id}/permissions",
            axum::routing::put(roles::update_role_permissions),
        )
        .route(
            "/api/products",
            get(products::list_products).post(products::create_product),
        )
        .route(
            "/api/products/{id}",
            axum::routing::patch(products::update_product),
        )
        .route(
            "/api/product-categories",
            get(catalog::list_categories).post(catalog::create_category),
        )
        .route(
            "/api/product-brands",
            get(catalog::list_brands).post(catalog::create_brand),
        )
        .route(
            "/api/units-of-measure",
            get(catalog::list_units).post(catalog::create_unit),
        )
        .route("/api/stock/balances", get(stock::list_balances))
        .route("/api/stock/add", post(stock::add_stock))
        .route("/api/stock/movements", get(stock::list_movements))
        .route(
            "/api/suppliers",
            get(suppliers::list_suppliers).post(suppliers::create_supplier),
        )
        .route(
            "/api/suppliers/{id}",
            axum::routing::patch(suppliers::update_supplier),
        )
        .route(
            "/api/procurement/orders",
            get(procurement::list_orders).post(procurement::create_order),
        )
        .route(
            "/api/procurement/orders/{id}/receive",
            post(procurement::receive_order),
        )
        .route(
            "/api/customers",
            get(customers::list_customers).post(customers::create_customer),
        )
        .route(
            "/api/customers/{id}",
            axum::routing::patch(customers::update_customer),
        )
        .route("/api/cash/sessions", get(cash::list_sessions).post(cash::open_shift))
        .route("/api/cash/sessions/{id}/movements", post(cash::record_movement))
        .route("/api/cash/sessions/{id}/close", post(cash::close_shift))
        .route("/api/cash/movements", get(cash::list_movements))
}
