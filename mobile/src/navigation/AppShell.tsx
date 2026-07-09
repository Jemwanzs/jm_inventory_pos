import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { useWindowDimensions, View } from "react-native";

import DashboardScreen from "../screens/DashboardScreen";
import InviteUserScreen from "../screens/InviteUserScreen";
import MoreMenuScreen from "../screens/MoreMenuScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import AuditLogsScreen from "../screens/settings/AuditLogsScreen";
import BusinessProfileScreen from "../screens/settings/BusinessProfileScreen";
import InventorySettingsScreen from "../screens/settings/InventorySettingsScreen";
import NotificationSettingsScreen from "../screens/settings/NotificationSettingsScreen";
import NumberingSettingsScreen from "../screens/settings/NumberingSettingsScreen";
import POSSettingsScreen from "../screens/settings/POSSettingsScreen";
import SecuritySettingsScreen from "../screens/settings/SecuritySettingsScreen";
import TaxSettingsScreen from "../screens/settings/TaxSettingsScreen";
import WorkspacesScreen from "../screens/settings/WorkspacesScreen";
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
