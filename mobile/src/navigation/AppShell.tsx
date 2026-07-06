import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { useWindowDimensions, View } from "react-native";

import DashboardScreen from "../screens/DashboardScreen";
import MoreMenuScreen from "../screens/MoreMenuScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import { colors } from "../theme";
import { BottomNav } from "./BottomNav";
import { MODULES } from "./modules";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const WIDE_BREAKPOINT = 768;

export default function AppShell() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [activeRoute, setActiveRoute] = useState("Dashboard");

  const navigate = (routeName: string) => {
    navigationRef.navigate(routeName as keyof RootStackParamList);
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setActiveRoute(navigationRef.getCurrentRoute()?.name ?? "Dashboard")}
      onStateChange={() => setActiveRoute(navigationRef.getCurrentRoute()?.name ?? "Dashboard")}
    >
      <View style={{ flex: 1, flexDirection: isWide ? "row" : "column", backgroundColor: colors.background }}>
        {isWide && <Sidebar activeRoute={activeRoute} onNavigate={navigate} />}

        <View style={{ flex: 1 }}>
          <TopBar activeRoute={activeRoute} />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            {MODULES.filter((m) => m.key !== "Dashboard").map((module) => (
              <Stack.Screen
                key={module.key}
                name={module.key}
                component={PlaceholderScreen}
                initialParams={{ label: module.label, icon: module.icon, description: module.description }}
              />
            ))}
            <Stack.Screen name="More" component={MoreMenuScreen} />
          </Stack.Navigator>
        </View>

        {!isWide && <BottomNav activeRoute={activeRoute} onNavigate={navigate} />}
      </View>
    </NavigationContainer>
  );
}
