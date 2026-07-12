import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { useWindowDimensions, View } from "react-native";

import DashboardScreen from "../screens/DashboardScreen";
import InviteUserScreen from "../screens/InviteUserScreen";
import MyRequestsScreen from "../screens/approvals/MyRequestsScreen";
import PendingApprovalsScreen from "../screens/approvals/PendingApprovalsScreen";
import CashMovementsScreen from "../screens/cash/CashMovementsScreen";
import CashSessionsScreen from "../screens/cash/CashSessionsScreen";
import AddCustomerScreen from "../screens/customers/AddCustomerScreen";
import CustomerListScreen from "../screens/customers/CustomerListScreen";
import POSTerminalScreen from "../screens/pos/POSTerminalScreen";
import SalesListScreen from "../screens/pos/SalesListScreen";
import ProductionOrdersScreen from "../screens/production/ProductionOrdersScreen";
import RecipesScreen from "../screens/production/RecipesScreen";
import ReportsHomeScreen from "../screens/reports/ReportsHomeScreen";
import MyTasksScreen from "../screens/tasks/MyTasksScreen";
import TaskBoardScreen from "../screens/tasks/TaskBoardScreen";
import MoreMenuScreen from "../screens/MoreMenuScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import AddStockScreen from "../screens/inventory/AddStockScreen";
import StockBalancesScreen from "../screens/inventory/StockBalancesScreen";
import StockMovementsScreen from "../screens/inventory/StockMovementsScreen";
import AddProductScreen from "../screens/products/AddProductScreen";
import BrandsScreen from "../screens/products/BrandsScreen";
import CategoriesScreen from "../screens/products/CategoriesScreen";
import ProductListScreen from "../screens/products/ProductListScreen";
import UnitsScreen from "../screens/products/UnitsScreen";
import PurchaseOrdersScreen from "../screens/procurement/PurchaseOrdersScreen";
import ApprovalSettingsScreen from "../screens/settings/ApprovalSettingsScreen";
import AuditLogsScreen from "../screens/settings/AuditLogsScreen";
import BusinessProfileScreen from "../screens/settings/BusinessProfileScreen";
import CustomFieldsScreen from "../screens/settings/CustomFieldsScreen";
import InventorySettingsScreen from "../screens/settings/InventorySettingsScreen";
import NotificationSettingsScreen from "../screens/settings/NotificationSettingsScreen";
import NumberingSettingsScreen from "../screens/settings/NumberingSettingsScreen";
import POSSettingsScreen from "../screens/settings/POSSettingsScreen";
import RolesPermissionsScreen from "../screens/settings/RolesPermissionsScreen";
import SecuritySettingsScreen from "../screens/settings/SecuritySettingsScreen";
import TaxSettingsScreen from "../screens/settings/TaxSettingsScreen";
import TemplatesScreen from "../screens/settings/TemplatesScreen";
import WorkspacesScreen from "../screens/settings/WorkspacesScreen";
import AddSupplierScreen from "../screens/suppliers/AddSupplierScreen";
import SupplierListScreen from "../screens/suppliers/SupplierListScreen";
import { colors } from "../theme";
import { BottomNav } from "./BottomNav";
import { FloatingAIButton } from "./FloatingAIButton";
import { MODULE_TREE } from "./screenTree";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const WIDE_BREAKPOINT = 768;

// Screens with real implementations instead of the generic placeholder.
const REAL_SCREENS: Record<string, React.ComponentType<any>> = {
  "Dashboard.Executive": DashboardScreen,
  "Settings.Users": InviteUserScreen,
  "Settings.Business": BusinessProfileScreen,
  "Settings.Workspaces": WorkspacesScreen,
  "Settings.Inventory": InventorySettingsScreen,
  "Settings.POS": POSSettingsScreen,
  "Settings.Numbering": NumberingSettingsScreen,
  "Settings.Tax": TaxSettingsScreen,
  "Settings.Notifications": NotificationSettingsScreen,
  "Settings.Security": SecuritySettingsScreen,
  "Settings.AuditLogs": AuditLogsScreen,
  "Settings.Approvals": ApprovalSettingsScreen,
  "Settings.Templates": TemplatesScreen,
  "Settings.CustomFields": CustomFieldsScreen,
  "Settings.Roles": RolesPermissionsScreen,
  "Products.List": ProductListScreen,
  "Products.Add": AddProductScreen,
  "Products.Categories": CategoriesScreen,
  "Products.Brands": BrandsScreen,
  "Products.Units": UnitsScreen,
  "Inventory.Balances": StockBalancesScreen,
  "Inventory.AddStock": AddStockScreen,
  "Inventory.Movements": StockMovementsScreen,
  "Suppliers.List": SupplierListScreen,
  "Suppliers.Add": AddSupplierScreen,
  "Procurement.Orders": PurchaseOrdersScreen,
  "Customers.List": CustomerListScreen,
  "Customers.Add": AddCustomerScreen,
  "Cash.Sessions": CashSessionsScreen,
  "Cash.Movements": CashMovementsScreen,
  "POS.Terminal": POSTerminalScreen,
  "POS.Sales": SalesListScreen,
  "Approvals.Pending": PendingApprovalsScreen,
  "Approvals.MyRequests": MyRequestsScreen,
  "Production.Recipes": RecipesScreen,
  "Production.Orders": ProductionOrdersScreen,
  "Tasks.Board": TaskBoardScreen,
  "Tasks.Mine": MyTasksScreen,
  "Reports.Home": ReportsHomeScreen,
  "Reports.Analytics": ReportsHomeScreen,
};

export default function AppShell() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [activeRoute, setActiveRoute] = useState("Dashboard.Executive");

  const navigate = (routeName: string) => {
    navigationRef.navigate(routeName as keyof RootStackParamList);
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setActiveRoute(navigationRef.getCurrentRoute()?.name ?? "Dashboard.Executive")}
      onStateChange={() => setActiveRoute(navigationRef.getCurrentRoute()?.name ?? "Dashboard.Executive")}
    >
      <View style={{ flex: 1, flexDirection: isWide ? "row" : "column", backgroundColor: colors.background }}>
        {isWide && <Sidebar activeRoute={activeRoute} onNavigate={navigate} />}

        <View style={{ flex: 1 }}>
          <TopBar activeRoute={activeRoute} />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {MODULE_TREE.flatMap((module) =>
              module.bundles.flatMap((b) =>
                b.screens.map((s) => (
                  <Stack.Screen
                    key={s.key}
                    name={s.key}
                    component={REAL_SCREENS[s.key] ?? PlaceholderScreen}
                    initialParams={{ label: s.label, icon: module.icon, description: s.description, tabs: s.tabs }}
                  />
                ))
              )
            )}
            <Stack.Screen name="More" component={MoreMenuScreen} />
          </Stack.Navigator>
          <FloatingAIButton />
        </View>

        {!isWide && <BottomNav activeRoute={activeRoute} onNavigate={navigate} />}
      </View>
    </NavigationContainer>
  );
}
