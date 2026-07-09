import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";
import { allScreens, findScreen } from "./screenTree";

interface TopBarProps {
  activeRoute: string;
}

export function TopBar({ activeRoute }: TopBarProps) {
  const found = findScreen(activeRoute);
  const label = found ? found.screen.label : activeRoute === "More" ? "More" : activeRoute;
  const isSingleScreenModule = found && allScreens(found.module).length <= 1;
  const breadcrumb =
    found && !isSingleScreenModule
      ? [found.module.label, found.bundle.key !== "_single" ? found.bundle.label : null]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <View style={styles.container}>
      {breadcrumb && <Text style={styles.breadcrumb}>{breadcrumb}</Text>}
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
