import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";
import { findModule } from "./modules";

interface TopBarProps {
  activeRoute: string;
}

export function TopBar({ activeRoute }: TopBarProps) {
  const module = findModule(activeRoute);
  const label = module?.label ?? (activeRoute === "More" ? "More" : activeRoute);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.heading.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
