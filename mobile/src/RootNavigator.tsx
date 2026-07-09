import React from "react";
import { ActivityIndicator, View } from "react-native";

import AuthGate from "./AuthGate";
import { useAuth } from "./auth/AuthContext";
import AppShell from "./navigation/AppShell";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";

export default function RootNavigator() {
  const { isLoading, token, mustChangePassword } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!token) {
    return <AuthGate />;
  }

  if (mustChangePassword) {
    return <ChangePasswordScreen />;
  }

  return <AppShell />;
}
