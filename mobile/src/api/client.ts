import { Platform } from "react-native";

// Android emulators reach the host machine at 10.0.2.2, not localhost.
// iOS simulators and web can use localhost directly.
const DEV_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_BASE_URL = `http://${DEV_HOST}:8080/api`;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, body.error ?? "Something went wrong");
  }

  return body as T;
}

export interface LoginResponse {
  token: string;
  must_change_password: boolean;
}

export function getUserIdFromToken(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const decoded = decodeURIComponent(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(decoded).sub ?? null;
  } catch {
    return null;
  }
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface ChangePasswordResponse {
  token: string;
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    },
    token
  );
}

export interface CreateInviteResponse {
  invite_link: string;
}

export function createInvite(email: string, authToken: string): Promise<CreateInviteResponse> {
  return request<CreateInviteResponse>(
    "/invites",
    { method: "POST", body: JSON.stringify({ email }) },
    authToken
  );
}

export interface InviteInfoResponse {
  email: string;
}

export function getInvite(inviteToken: string): Promise<InviteInfoResponse> {
  return request<InviteInfoResponse>(`/invites/${encodeURIComponent(inviteToken)}`);
}

export interface AcceptInviteResponse {
  token: string;
  must_change_password: boolean;
}

export function acceptInvite(
  inviteToken: string,
  name: string,
  password: string
): Promise<AcceptInviteResponse> {
  return request<AcceptInviteResponse>(`/invites/${encodeURIComponent(inviteToken)}/accept`, {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
}

export type SettingsCategory =
  | "business"
  | "inventory"
  | "pos"
  | "tax"
  | "notifications"
  | "security"
  | "approval"
  | "templates";

export function getSettings<T extends object>(category: SettingsCategory, token: string): Promise<T> {
  return request<T>(`/settings/${category}`, {}, token);
}

export function putSettings<T extends object>(
  category: SettingsCategory,
  data: T,
  token: string
): Promise<T> {
  return request<T>(
    `/settings/${category}`,
    { method: "PUT", body: JSON.stringify(data) },
    token
  );
}

export interface Workspace {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export function listWorkspaces(token: string): Promise<Workspace[]> {
  return request<Workspace[]>("/workspaces", {}, token);
}

export function createWorkspace(name: string, type: string, token: string): Promise<Workspace> {
  return request<Workspace>(
    "/workspaces",
    { method: "POST", body: JSON.stringify({ name, type }) },
    token
  );
}

export function updateWorkspace(
  id: string,
  patch: Partial<Pick<Workspace, "name" | "type" | "is_active">>,
  token: string
): Promise<Workspace> {
  return request<Workspace>(
    `/workspaces/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    token
  );
}

export interface NumberingSequence {
  document_type: string;
  prefix: string;
  include_year: boolean;
  include_month: boolean;
  sequence_length: number;
  separator: string;
  next_number: number;
}

export function listNumbering(token: string): Promise<NumberingSequence[]> {
  return request<NumberingSequence[]>("/settings/numbering", {}, token);
}

export function updateNumbering(
  documentType: string,
  patch: Pick<NumberingSequence, "prefix" | "include_year" | "include_month" | "sequence_length" | "separator">,
  token: string
): Promise<NumberingSequence> {
  return request<NumberingSequence>(
    `/settings/numbering/${encodeURIComponent(documentType)}`,
    { method: "PUT", body: JSON.stringify(patch) },
    token
  );
}

export interface AuditLogEntry {
  id: string;
  action: string;
  module: string;
  user_email: string | null;
  created_at: string;
}

export function listAuditLogs(token: string): Promise<AuditLogEntry[]> {
  return request<AuditLogEntry[]>("/audit-logs", {}, token);
}

export interface CustomField {
  id: string;
  module: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  is_active: boolean;
}

export function listCustomFields(token: string): Promise<CustomField[]> {
  return request<CustomField[]>("/custom-fields", {}, token);
}

export function createCustomField(
  req: { module: string; field_name: string; field_type: string; is_required: boolean },
  token: string
): Promise<CustomField> {
  return request<CustomField>("/custom-fields", { method: "POST", body: JSON.stringify(req) }, token);
}

export function updateCustomField(
  id: string,
  is_active: boolean,
  token: string
): Promise<CustomField> {
  return request<CustomField>(
    `/custom-fields/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ is_active }) },
    token
  );
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface Permission {
  id: string;
  code: string;
  description: string | null;
}

export interface RolesMatrix {
  roles: Role[];
  permissions: Permission[];
  assignments: { role_id: string; permission_id: string }[];
}

export function getRolesMatrix(token: string): Promise<RolesMatrix> {
  return request<RolesMatrix>("/roles-matrix", {}, token);
}

export function updateRolePermissions(
  roleId: string,
  permissionIds: string[],
  token: string
): Promise<void> {
  return request<void>(
    `/roles/${encodeURIComponent(roleId)}/permissions`,
    { method: "PUT", body: JSON.stringify({ permission_ids: permissionIds }) },
    token
  );
}

export interface CatalogItem {
  id: string;
  name: string;
  is_active: boolean;
}

export interface UnitItem extends CatalogItem {
  abbreviation: string;
}

export function listCategories(token: string): Promise<CatalogItem[]> {
  return request<CatalogItem[]>("/product-categories", {}, token);
}

export function createCategory(name: string, token: string): Promise<CatalogItem> {
  return request<CatalogItem>("/product-categories", { method: "POST", body: JSON.stringify({ name }) }, token);
}

export function listBrands(token: string): Promise<CatalogItem[]> {
  return request<CatalogItem[]>("/product-brands", {}, token);
}

export function createBrand(name: string, token: string): Promise<CatalogItem> {
  return request<CatalogItem>("/product-brands", { method: "POST", body: JSON.stringify({ name }) }, token);
}

export function listUnits(token: string): Promise<UnitItem[]> {
  return request<UnitItem[]>("/units-of-measure", {}, token);
}

export function createUnit(name: string, abbreviation: string, token: string): Promise<UnitItem> {
  return request<UnitItem>(
    "/units-of-measure",
    { method: "POST", body: JSON.stringify({ name, abbreviation }) },
    token
  );
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category_name: string | null;
  brand_name: string | null;
  unit_abbreviation: string | null;
  cost_price: string;
  selling_price: string;
  is_active: boolean;
}

export function listProducts(token: string): Promise<Product[]> {
  return request<Product[]>("/products", {}, token);
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  barcode?: string;
  category_id?: string;
  brand_id?: string;
  unit_id?: string;
  description?: string;
  cost_price: string;
  selling_price: string;
}

export function createProduct(req: CreateProductRequest, token: string): Promise<Product> {
  return request<Product>("/products", { method: "POST", body: JSON.stringify(req) }, token);
}

export function updateProductActive(id: string, is_active: boolean, token: string): Promise<void> {
  return request<void>(
    `/products/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ is_active }) },
    token
  );
}

export interface StockBalance {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  workspace_id: string;
  workspace_name: string;
  quantity_available: string;
  average_cost: string;
}

export function listStockBalances(token: string): Promise<StockBalance[]> {
  return request<StockBalance[]>("/stock/balances", {}, token);
}

export interface AddStockRequest {
  workspace_id: string;
  product_id: string;
  movement_type: string;
  quantity: string;
  unit_cost?: string;
  reason?: string;
}

export interface AddStockResponse {
  quantity_available: string;
  average_cost: string;
}

export function addStock(req: AddStockRequest, token: string): Promise<AddStockResponse> {
  return request<AddStockResponse>("/stock/add", { method: "POST", body: JSON.stringify(req) }, token);
}

export interface StockMovement {
  id: string;
  product_name: string;
  workspace_name: string;
  movement_type: string;
  quantity_in: string;
  quantity_out: string;
  unit_cost: string | null;
  reason: string | null;
  user_email: string | null;
  created_at: string;
}

export function listStockMovements(token: string): Promise<StockMovement[]> {
  return request<StockMovement[]>("/stock/movements", {}, token);
}

export interface DashboardSummary {
  stock_value: string;
  product_count: number;
  workspace_count: number;
  movements_today: number;
}

export function getDashboardSummary(token: string): Promise<DashboardSummary> {
  return request<DashboardSummary>("/dashboard/summary", {}, token);
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  payment_terms: string | null;
  is_active: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms?: string;
}

export function listSuppliers(token: string): Promise<Supplier[]> {
  return request<Supplier[]>("/suppliers", {}, token);
}

export function createSupplier(req: CreateSupplierRequest, token: string): Promise<Supplier> {
  return request<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(req) }, token);
}

export function updateSupplierActive(id: string, isActive: boolean, token: string): Promise<void> {
  return request<void>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) }, token);
}

export interface PurchaseOrder {
  id: string;
  supplier_name: string;
  workspace_name: string;
  status: string;
  item_count: number;
  total_value: string;
  notes: string | null;
  created_at: string;
  received_at: string | null;
}

export interface OrderItemRequest {
  product_id: string;
  quantity: string;
  unit_cost: string;
}

export interface CreateOrderRequest {
  supplier_id: string;
  workspace_id: string;
  notes?: string;
  items: OrderItemRequest[];
}

export function listPurchaseOrders(token: string): Promise<PurchaseOrder[]> {
  return request<PurchaseOrder[]>("/procurement/orders", {}, token);
}

export function createPurchaseOrder(req: CreateOrderRequest, token: string): Promise<{ id: string }> {
  return request<{ id: string }>("/procurement/orders", { method: "POST", body: JSON.stringify(req) }, token);
}

export function receivePurchaseOrder(id: string, token: string): Promise<void> {
  return request<void>(`/procurement/orders/${id}/receive`, { method: "POST" }, token);
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customer_group: string | null;
  credit_limit: string;
  is_active: boolean;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_group?: string;
  credit_limit?: string;
}

export function listCustomers(token: string): Promise<Customer[]> {
  return request<Customer[]>("/customers", {}, token);
}

export function createCustomer(req: CreateCustomerRequest, token: string): Promise<Customer> {
  return request<Customer>("/customers", { method: "POST", body: JSON.stringify(req) }, token);
}

export function updateCustomerActive(id: string, isActive: boolean, token: string): Promise<void> {
  return request<void>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) }, token);
}

export interface CashSession {
  id: string;
  workspace_name: string;
  cashier_id: string;
  cashier_email: string;
  opening_float: string;
  status: string;
  cash_in: string;
  cash_out: string;
  expected_cash: string | null;
  actual_cash: string | null;
  variance: string | null;
  opened_at: string;
  closed_at: string | null;
}

export function listCashSessions(token: string): Promise<CashSession[]> {
  return request<CashSession[]>("/cash/sessions", {}, token);
}

export function openShift(workspace_id: string, opening_float: string, token: string): Promise<{ id: string }> {
  return request<{ id: string }>("/cash/sessions", { method: "POST", body: JSON.stringify({ workspace_id, opening_float }) }, token);
}

export function recordCashMovement(
  sessionId: string,
  movement_type: "In" | "Out",
  amount: string,
  reason: string | undefined,
  token: string
): Promise<void> {
  return request<void>(
    `/cash/sessions/${sessionId}/movements`,
    { method: "POST", body: JSON.stringify({ movement_type, amount, reason }) },
    token
  );
}

export function closeShift(
  sessionId: string,
  actual_cash: string,
  notes: string | undefined,
  token: string
): Promise<{ expected_cash: string; variance: string }> {
  return request(`/cash/sessions/${sessionId}/close`, { method: "POST", body: JSON.stringify({ actual_cash, notes }) }, token);
}

export interface CashMovement {
  id: string;
  workspace_name: string;
  cashier_email: string | null;
  movement_type: string;
  amount: string;
  reason: string | null;
  created_at: string;
}

export function listCashMovements(token: string): Promise<CashMovement[]> {
  return request<CashMovement[]>("/cash/movements", {}, token);
}
