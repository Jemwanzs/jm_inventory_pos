import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "./auth/AuthContext";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";

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
    return <LoginScreen />;
  }

  if (mustChangePassword) {
    return <ChangePasswordScreen />;
  }

  return <HomeScreen />;
}
