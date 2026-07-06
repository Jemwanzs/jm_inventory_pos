import { Ionicons } from "@expo/vector-icons";

export interface ModuleDef {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

// Mirrors docs/architecture.md Section 8 (Application Navigation).
export const MODULES: ModuleDef[] = [
  { key: "Dashboard", label: "Dashboard", icon: "speedometer-outline", description: "Live business overview." },
  { key: "Inventory", label: "Inventory", icon: "cube-outline", description: "Stock balances, movements, and adjustments." },
  { key: "Products", label: "Products", icon: "pricetag-outline", description: "Product catalog, variants, and pricing." },
  { key: "StockOperations", label: "Stock Operations", icon: "swap-horizontal-outline", description: "Add, transfer, adjust, and count stock." },
  { key: "Procurement", label: "Procurement", icon: "cart-outline", description: "Purchase requests, orders, and receiving." },
  { key: "Suppliers", label: "Suppliers", icon: "business-outline", description: "Supplier profiles and purchase history." },
  { key: "POS", label: "POS & Sales", icon: "storefront-outline", description: "Point of sale and sales history." },
  { key: "Customers", label: "Customers", icon: "people-outline", description: "Customer profiles, credit, and history." },
  { key: "CashManagement", label: "Cash Management", icon: "cash-outline", description: "Cashier shifts and cash sessions." },
  { key: "Production", label: "Production / Recipes", icon: "flask-outline", description: "Bills of materials and production orders." },
  { key: "Documents", label: "Documents", icon: "document-text-outline", description: "Attachments linked across every module." },
  { key: "Tasks", label: "Tasks", icon: "checkbox-outline", description: "Assigned work and follow-ups." },
  { key: "Approvals", label: "Approvals Center", icon: "checkmark-done-outline", description: "Pending, approved, and rejected requests." },
  { key: "Notifications", label: "Notifications", icon: "notifications-outline", description: "Alerts, reminders, and system messages." },
  { key: "Reports", label: "Reports & Analytics", icon: "bar-chart-outline", description: "Business reports and trend analysis." },
  { key: "AIAssistant", label: "AI Assistant", icon: "sparkles-outline", description: "Ask questions about your business data." },
  { key: "Integrations", label: "Integrations", icon: "git-network-outline", description: "External systems and API connections." },
  { key: "Administration", label: "Administration", icon: "shield-checkmark-outline", description: "Tenant, user, and role management." },
  { key: "Settings", label: "Settings", icon: "settings-outline", description: "Business, inventory, and POS configuration." },
];

// The five always-visible mobile bottom tabs — see docs/ui-ux.md Mobile Layout.
export const MOBILE_PRIMARY_KEYS = ["Dashboard", "POS", "Inventory", "Reports"] as const;

export const MOBILE_PRIMARY_MODULES = MODULES.filter((m) => (MOBILE_PRIMARY_KEYS as readonly string[]).includes(m.key));
export const MORE_MODULES = MODULES.filter((m) => !(MOBILE_PRIMARY_KEYS as readonly string[]).includes(m.key));

export function findModule(key: string): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key);
}
