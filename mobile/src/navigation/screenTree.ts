import { Ionicons } from "@expo/vector-icons";

export interface ScreenDef {
  key: string;
  label: string;
  description: string;
  /** Rendered as a note on the placeholder — the screen's own internal tabs once built (e.g. a profile page's Overview/Stock/Pricing tabs), not a further sidebar level. */
  tabs?: string[];
  /** Marks a non-navigable divider row used to group Settings' absorbed sub-modules. */
  isGroupLabel?: boolean;
}

export interface ModuleDef {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  screens: ScreenDef[];
}

function screen(key: string, label: string, description: string, tabs?: string[]): ScreenDef {
  return { key, label, description, tabs };
}

function group(label: string): ScreenDef {
  return { key: `group:${label}`, label, description: "", isGroupLabel: true };
}

// Full screen inventory per docs/screens.md, restructured per product decision:
// Notifications, Integrations, and Administration are folded into Settings as
// sub-sections rather than standalone sidebar modules, and the old separate
// "Stock Operations" entry is merged into Inventory (docs/screens.md always
// treated stock operations as part of the 13-screen Inventory section).
export const MODULE_TREE: ModuleDef[] = [
  {
    key: "Dashboard",
    label: "Dashboard",
    icon: "speedometer-outline",
    description: "Live business overview.",
    screens: [
      screen("Dashboard.Executive", "Executive Dashboard", "Today's/monthly sales, stock value, profit summary, pending approvals, low stock alerts, branch performance, quick actions."),
      screen("Dashboard.Sales", "Sales Dashboard", "Daily sales trend, cashier performance, payment-method breakdown, top sellers, period comparison."),
      screen("Dashboard.Inventory", "Inventory Dashboard", "Stock balance summary, low/out-of-stock items, movement trends, slow-moving stock."),
      screen("Dashboard.Branch", "Branch / Workspace Dashboard", "Branch-level performance, sales by workspace, stock by warehouse/store, user activity per branch."),
      screen("Dashboard.Alerts", "Alerts Dashboard", "Low stock, approval, cash variance, expiry, and suspicious-activity alerts in one feed."),
    ],
  },
  {
    key: "Products",
    label: "Products",
    icon: "pricetag-outline",
    description: "Product catalog, variants, and pricing.",
    screens: [
      screen("Products.List", "Product List", "Search/filter by category, brand, branch, status; table and card view; export."),
      screen("Products.Add", "Add Product", "Name, SKU/barcode, category, brand, unit, image, cost/selling price, tax, stock-tracking options."),
      screen("Products.Profile", "Product Profile", "Full product detail.", ["Overview", "Stock", "Pricing", "Sales", "Purchases", "Documents", "History"]),
      screen("Products.Variants", "Product Variants", "Size/color/capacity/packaging variants with variant-level SKU, pricing, and stock."),
      screen("Products.Categories", "Categories", "Add/edit categories, parent category, activate/deactivate."),
      screen("Products.Brands", "Brands", "Add/edit brands, link to products."),
      screen("Products.Units", "Units of Measure", "Add units and conversions — buy in one unit, sell in another."),
      screen("Products.PriceLists", "Price Lists", "Retail, wholesale, customer-specific, branch-specific, and promotional pricing."),
      screen("Products.Barcodes", "Barcode / QR Codes", "Generate and print barcode/QR labels; link a scanner to a product."),
      screen("Products.Import", "Product Import", "Download template, upload, validate rows, show failures, confirm before import."),
      screen("Products.Settings", "Product Settings", "Required fields, SKU format, variant rules, approval rules, numbering rules."),
    ],
  },
  {
    key: "Inventory",
    label: "Inventory",
    icon: "cube-outline",
    description: "Stock balances, movements, and adjustments.",
    screens: [
      screen("Inventory.Balances", "Stock Balances", "Current stock by branch/store/warehouse; available/reserved/damaged/expired; export."),
      screen("Inventory.Movements", "Stock Movements", "Full in/out ledger, filterable by product/date/user/branch."),
      screen("Inventory.Opening", "Opening Stock", "First stock entry, bulk upload, document attachment, approval if required."),
      screen("Inventory.AddStock", "Add Stock", "Purchased stock entry: supplier, quantity, cost, receipt upload, approval-gated update."),
      screen("Inventory.Adjustments", "Stock Adjustments", "Increase/reduce with reason, evidence, approval workflow, audit trail."),
      screen("Inventory.Transfers", "Stock Transfers", "Branch-to-branch dispatch/receive with in-transit tracking and approval."),
      screen("Inventory.Reservations", "Stock Reservations", "Reserve for a customer order, release, or convert to sale."),
      screen("Inventory.Counts", "Stock Counts", "Physical count sessions, blind-count option, expected-vs-counted variance, reconciliation approval."),
      screen("Inventory.Damaged", "Damaged Stock", "Record damage with photos; decide repair, return, or write-off."),
      screen("Inventory.Expired", "Expired Stock", "Track expiries, alert before expiry, remove from sellable stock."),
      screen("Inventory.WriteOffs", "Stock Write-Offs", "Write off with reason, required approval, audit trail."),
      screen("Inventory.Valuation", "Stock Valuation", "FIFO / weighted average / last purchase cost, closing value, COGS."),
      screen("Inventory.Settings", "Inventory Settings", "Negative-stock policy, low-stock thresholds, batch/serial/expiry tracking, valuation method."),
    ],
  },
  {
    key: "Procurement",
    label: "Procurement",
    icon: "cart-outline",
    description: "Purchase requests, orders, and receiving.",
    screens: [
      screen("Procurement.Requests", "Purchase Requests", "Create and submit for approval."),
      screen("Procurement.Orders", "Purchase Orders", "Create PO, link supplier, add products/costs, print/download."),
      screen("Procurement.GRN", "Goods Received Notes", "Receive goods, compare ordered vs. received, update inventory."),
      screen("Procurement.Invoices", "Supplier Invoices", "Capture invoice, attach document, track status."),
      screen("Procurement.Returns", "Purchase Returns", "Return to supplier, adjust stock, track refund/replacement."),
      screen("Procurement.Approvals", "Procurement Approvals", "Approve/reject requests and POs with comments."),
      screen("Procurement.Reports", "Purchase Reports", "By supplier, by product, cost trend, outstanding supplier invoices."),
      screen("Procurement.Settings", "Procurement Settings", "PO numbering, approval rules, required supplier documents."),
    ],
  },
  {
    key: "Suppliers",
    label: "Suppliers",
    icon: "business-outline",
    description: "Supplier profiles and purchase history.",
    screens: [
      screen("Suppliers.List", "Supplier List", "Search, filter, status."),
      screen("Suppliers.Add", "Add Supplier", "Name, contact person, phone/email, address, payment terms."),
      screen("Suppliers.Profile", "Supplier Profile", "Full supplier detail.", ["Overview", "Purchases", "Invoices", "Payments", "Documents"]),
      screen("Suppliers.Documents", "Supplier Documents", "Contracts, invoices, compliance documents."),
      screen("Suppliers.Reports", "Supplier Reports", "Purchase history, balance, performance."),
    ],
  },
  {
    key: "POS",
    label: "POS & Sales",
    icon: "storefront-outline",
    description: "Point of sale and sales history.",
    screens: [
      screen("POS.Terminal", "POS Terminal", "Search, barcode scan, product grid, cart, discounts, checkout, receipt."),
      screen("POS.Held", "Held Sales", "Hold, resume, cancel a held sale."),
      screen("POS.Sales", "Sales List", "Filter by date/branch/cashier/customer."),
      screen("POS.SaleDetails", "Sale Details", "Items sold, payment detail, receipt/invoice, refund/return entry point."),
      screen("POS.Quotations", "Quotations", "Create, convert to invoice/sale, PDF."),
      screen("POS.Proformas", "Proformas", "Create, convert to invoice, status tracking."),
      screen("POS.Invoices", "Invoices", "Create, track paid/unpaid/partial, PDF."),
      screen("POS.Receipts", "Receipts", "View, reprint, email."),
      screen("POS.Payments", "Payments", "Record manual payment (cash/M-Pesa/card/bank/credit), partial payments."),
      screen("POS.Returns", "Returns", "Customer returns with reason; return to stock/damage/write-off."),
      screen("POS.Refunds", "Refunds", "Process with approval workflow, track refund method."),
      screen("POS.Discounts", "Discounts", "Rules, approval, history."),
      screen("POS.CreditSales", "Credit Sales", "Sell on credit, track balance, credit limit, payment terms."),
      screen("POS.Reports", "Sales Reports", "Daily/monthly, by product, by cashier, by branch."),
      screen("POS.Settings", "POS Settings", "Receipt format, payment methods, discount limits, tax display, cashier rules, shift-closure rules."),
    ],
  },
  {
    key: "Customers",
    label: "Customers",
    icon: "people-outline",
    description: "Customer profiles, credit, and history.",
    screens: [
      screen("Customers.List", "Customer List", "Search, filter, status."),
      screen("Customers.Add", "Add Customer", "Name, phone/email, address, group, credit limit."),
      screen("Customers.Profile", "Customer Profile", "Full customer detail.", ["Overview", "Sales", "Invoices", "Payments", "Documents", "Credit"]),
      screen("Customers.Credit", "Customer Credit", "Outstanding balance, credit limit, aging report, payment history."),
      screen("Customers.Documents", "Customer Documents", "Upload and link to sales/invoices."),
      screen("Customers.Reports", "Customer Reports", "Sales history, outstanding balances, top customers."),
    ],
  },
  {
    key: "CashManagement",
    label: "Cash Management",
    icon: "cash-outline",
    description: "Cashier shifts and cash sessions.",
    screens: [
      screen("Cash.Sessions", "Cash Sessions", "Open/closed shifts by cashier/branch/date."),
      screen("Cash.OpenShift", "Open Shift", "Opening float, assign cashier and counter."),
      screen("Cash.CloseShift", "Close Shift", "Expected vs. actual cash, variance, supervisor approval."),
      screen("Cash.Movements", "Cash Movements", "Cash in/out, petty cash, expense recording."),
      screen("Cash.Variance", "Cash Variance", "Shortages/excess with explanation notes and approval."),
      screen("Cash.Handover", "Shift Handover Notes", "Pending issues, complaints, cash/stock notes."),
      screen("Cash.Reports", "Cash Reports", "Cashier report, variance report, daily summary."),
    ],
  },
  {
    key: "Production",
    label: "Production / Recipes",
    icon: "flask-outline",
    description: "Bills of materials and production orders.",
    screens: [
      screen("Production.Recipes", "Recipes / BOM", "Define raw materials and output quantity."),
      screen("Production.Orders", "Production Orders", "Consume raw stock, add finished goods."),
      screen("Production.Wastage", "Wastage", "Record with reason and photo."),
      screen("Production.FinishedGoods", "Finished Goods", "Track completed production into inventory."),
      screen("Production.Ingredients", "Ingredient Stock", "Raw material levels, low-stock alerts."),
      screen("Production.Reports", "Production Reports", "Cost, wastage, finished-goods reports."),
      screen("Production.Settings", "Production Settings", "Auto-deduct ingredients, wastage approvals, recipe costing rules."),
    ],
  },
  {
    key: "Approvals",
    label: "Approvals Center",
    icon: "checkmark-done-outline",
    description: "Pending, approved, and rejected requests.",
    screens: [
      screen("Approvals.Pending", "Pending Approvals", "Everything awaiting the current user; approve/reject with comments."),
      screen("Approvals.MyRequests", "My Requests", "Requests the user submitted, with status."),
      screen("Approvals.Approved", "Approved Requests", "History, filterable by module/date/user."),
      screen("Approvals.Rejected", "Rejected Requests", "Rejection reason, resubmit where allowed."),
      screen("Approvals.Workflows", "Approval Workflows", "List of configured workflows by module."),
      screen("Approvals.Builder", "Workflow Builder", "Drag-and-drop steps, role/user approver, maker-checker, delegation."),
    ],
  },
  {
    key: "Documents",
    label: "Documents",
    icon: "document-text-outline",
    description: "Attachments linked across every module.",
    screens: [
      screen("Documents.Library", "Document Library", "Search, filter, preview/download across all uploads."),
      screen("Documents.Upload", "Upload Document", "Select linked module, add description."),
      screen("Documents.Details", "Document Details", "Preview, download, linked records, version history."),
      screen("Documents.Templates", "Document Templates", "Receipt, invoice, quotation, PO templates."),
      screen("Documents.Settings", "Document Settings", "File size limits, allowed types, retention rules."),
    ],
  },
  {
    key: "Tasks",
    label: "Tasks",
    icon: "checkbox-outline",
    description: "Assigned work and follow-ups.",
    screens: [
      screen("Tasks.Board", "Task Board", "Kanban: To Do / In Progress / Done."),
      screen("Tasks.Mine", "My Tasks", "Assigned tasks with due date and priority."),
      screen("Tasks.Create", "Create Task", "Assign user, due date, link to a product/sale/stock issue."),
      screen("Tasks.Details", "Task Details", "Comments, attachments, status updates."),
      screen("Tasks.Reports", "Task Reports", "Overdue, completed, user productivity."),
    ],
  },
  {
    key: "Reports",
    label: "Reports & Analytics",
    icon: "bar-chart-outline",
    description: "Business reports and trend analysis.",
    screens: [
      screen("Reports.Home", "Reports Home", "Categories, saved reports, recent exports."),
      screen("Reports.Sales", "Sales Reports", "Daily/monthly, by product, by cashier, by branch."),
      screen("Reports.Inventory", "Inventory Reports", "Stock balance, movement, low/out-of-stock."),
      screen("Reports.Valuation", "Stock Valuation Reports", "Closing value, COGS, FIFO/weighted average."),
      screen("Reports.Procurement", "Procurement Reports", "Purchases, supplier invoices, purchase returns."),
      screen("Reports.Customers", "Customer Reports", "Sales, credit, balances."),
      screen("Reports.Suppliers", "Supplier Reports", "Purchases, balances."),
      screen("Reports.Cash", "Cash Reports", "Cashier summary, variance, payment-method breakdown."),
      screen("Reports.Profit", "Profit Reports", "Gross profit, product margin, branch margin."),
      screen("Reports.Audit", "Audit Reports", "User activity, settings changes, transaction changes."),
      screen("Reports.Analytics", "Analytics Dashboard", "Charts, trends, KPIs, drill-down views."),
      screen("Reports.Export", "Export Center", "PDF/Excel/CSV exports and export history."),
    ],
  },
  {
    key: "DataQuality",
    label: "Data Quality Center",
    icon: "shield-half-outline",
    description: "Missing, risky, and abnormal records that need attention.",
    screens: [
      screen("DataQuality.Dashboard", "Data Quality Dashboard", "Missing-data count, risky records, abnormal records overview."),
      screen("DataQuality.MissingProducts", "Missing Product Data", "Products without cost, SKU, or category."),
      screen("DataQuality.StockExceptions", "Stock Exceptions", "Negative stock, unmatched stock, duplicate SKUs."),
      screen("DataQuality.SalesExceptions", "Sales Exceptions", "Sales without payment, unusual discounts, excessive refunds."),
      screen("DataQuality.FixCenter", "Fix Center", "Suggested corrections, bulk fixes, assign an issue to a user."),
    ],
  },
  {
    key: "AIAssistant",
    label: "AI Assistant",
    icon: "sparkles-outline",
    description: "Ask questions about your business data.",
    screens: [
      screen("AI.Chat", "AI Chat", "Ask business questions, get answers from reports/data."),
      screen("AI.Insights", "AI Insights", "Suggested actions, risk alerts, performance insights."),
      screen("AI.ReportBuilder", "AI Report Builder", "Generate a report from a prompt, export the output."),
      screen("AI.Settings", "AI Settings", "Enable/disable, allowed data access, assistant name."),
    ],
  },
  {
    key: "Settings",
    label: "Settings",
    icon: "settings-outline",
    description: "Business, inventory, POS, notifications, integrations, and administration.",
    screens: [
      group("General"),
      screen("Settings.Business", "Business Profile", "Name, logo, contacts, address, currency."),
      screen("Settings.Workspaces", "Workspaces", "Branches, stores, warehouses, POS counters."),
      screen("Settings.Users", "Users", "Create, edit, deactivate, reset password, and invite new users."),
      screen("Settings.Roles", "Roles & Permissions", "Permission matrix, module access, workspace access."),
      screen("Settings.Inventory", "Inventory Settings", "Stock rules, tracking rules, valuation method, low-stock alerts."),
      screen("Settings.POS", "POS Settings", "Payment methods, receipt setup, discount rules, shift-closure rules."),
      screen("Settings.Numbering", "Numbering Settings", "Product, receipt, invoice, PO, quotation numbers."),
      screen("Settings.Approvals", "Approval Settings", "Workflow rules, approval levels, delegation."),
      screen("Settings.Notifications", "Notification Settings", "Email/in-app alerts, rule-based notifications."),
      screen("Settings.Tax", "Tax Settings", "Tax rates, tax-inclusive pricing, tax display."),
      screen("Settings.CustomFields", "Custom Fields", "Field types, applied to products/customers/suppliers/sales."),
      screen("Settings.Templates", "Templates", "Receipt, invoice, quotation, email templates."),
      screen("Settings.Security", "Security Settings", "Password rules, session timeout, MFA readiness."),
      screen("Settings.AuditLogs", "Audit Logs", "Business audit logs, filter by user/module/action, export."),
      group("Notifications"),
      screen("Settings.NotificationCenter", "Notification Center", "Approvals, warnings, alerts, and tasks — unread, read, completed."),
      group("Integrations"),
      screen("Settings.IntegrationsHome", "Integrations Home", "Available integrations, connected systems."),
      screen("Settings.ApiKeys", "API Keys", "Create, revoke, track usage."),
      screen("Settings.Webhooks", "Webhooks", "Add URL, select event triggers."),
      screen("Settings.ImportJobs", "Import Jobs", "Track bulk imports, view success/failure rows."),
      screen("Settings.ExportJobs", "Export Jobs", "Track report exports, download generated files."),
      screen("Settings.IntegrationLogs", "Integration Logs", "Failed/success logs, retry option."),
      group("Administration"),
      screen("Settings.Tenants", "Tenants", "Create business tenant, activate/suspend, view usage."),
      screen("Settings.TenantProfile", "Tenant Profile", "Business details, enabled modules, users, subscription status."),
      screen("Settings.Plans", "Subscription Plans", "Create plan, module/user/storage limits."),
      screen("Settings.ModuleManagement", "Module Management", "Enable/disable modules per tenant, feature flags."),
      screen("Settings.PlatformUsers", "Platform Users", "Super admin and support users, access control."),
      screen("Settings.SystemHealth", "System Health", "API status, worker status, storage usage, failed jobs."),
      screen("Settings.AuditOverview", "Audit Overview", "Platform-level audit logs, tenant activity."),
      screen("Settings.BackupRestore", "Backup & Restore", "Tenant backups, restore points, data export."),
      screen("Settings.PlatformSettings", "Platform Settings", "Global, email, and security settings."),
    ],
  },
];

export const MOBILE_PRIMARY_KEYS = ["Dashboard", "POS", "Inventory", "Reports"] as const;

export function findModule(key: string): ModuleDef | undefined {
  return MODULE_TREE.find((m) => m.key === key);
}

export function findScreen(screenKey: string): { module: ModuleDef; screen: ScreenDef } | undefined {
  for (const module of MODULE_TREE) {
    const found = module.screens.find((s) => s.key === screenKey);
    if (found) return { module, screen: found };
  }
  return undefined;
}

export function defaultScreenFor(moduleKey: string): ScreenDef | undefined {
  const module = findModule(moduleKey);
  return module?.screens.find((s) => !s.isGroupLabel);
}
