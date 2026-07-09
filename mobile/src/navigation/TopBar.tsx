import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";
import { findScreen } from "./screenTree";

interface TopBarProps {
  activeRoute: string;
}

export function TopBar({ activeRoute }: TopBarProps) {
  const found = findScreen(activeRoute);
  const label = found ? found.screen.label : activeRoute === "More" ? "More" : activeRoute;
  const moduleLabel = found && found.module.screens.filter((s) => !s.isGroupLabel).length > 1 ? found.module.label : null;

  return (
    <View style={styles.container}>
      {moduleLabel && <Text style={styles.breadcrumb}>{moduleLabel}</Text>}
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
  breadcrumb: {
    fontSize: typography.caption.fontSize,
    color: colors.text.muted,
    marginBottom: 1,
  },
  title: {
    fontSize: typography.heading.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
