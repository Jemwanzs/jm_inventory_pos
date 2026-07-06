import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing, typography } from "../theme";
import { MOBILE_PRIMARY_MODULES } from "./modules";

interface BottomNavProps {
  activeRoute: string;
  onNavigate: (routeName: string) => void;
}

const MORE_KEY = "More";

export function BottomNav({ activeRoute, onNavigate }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const isMoreActive = !MOBILE_PRIMARY_MODULES.some((m) => m.key === activeRoute) && activeRoute !== "Dashboard" && activeRoute !== "POS" && activeRoute !== "Inventory" && activeRoute !== "Reports";

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {MOBILE_PRIMARY_MODULES.map((module) => {
        const isActive = module.key === activeRoute;
        return (
          <TouchableOpacity key={module.key} style={styles.item} onPress={() => onNavigate(module.key)}>
            <Ionicons
              name={module.icon}
              size={22}
              color={isActive ? colors.brand.brown : colors.text.muted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{module.label}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={styles.item} onPress={() => onNavigate(MORE_KEY)}>
        <Ionicons name="menu-outline" size={22} color={isMoreActive ? colors.brand.brown : colors.text.muted} />
        <Text style={[styles.label, isMoreActive && styles.labelActive]}>More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  label: {
    fontSize: typography.label.fontSize - 2,
    color: colors.text.muted,
  },
  labelActive: {
    color: colors.brand.brown,
    fontWeight: "700",
  },
});
