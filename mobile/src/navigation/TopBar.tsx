import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "../theme";
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
      <View style={styles.titleWrap}>
        {breadcrumb && <Text style={styles.breadcrumb}>{breadcrumb}</Text>}
        <Text style={styles.title}>{label}</Text>
      </View>
      <View style={styles.poweredBy}>
        <View style={styles.poweredByBadge}>
          <Ionicons name="flash" size={11} color={colors.text.inverse} />
        </View>
        <Text style={styles.poweredByText}>
          Powered by <Text style={styles.poweredByBrand}>SyncScore</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleWrap: {
    flexShrink: 1,
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
  poweredBy: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  poweredByBadge: {
    width: 18,
    height: 18,
    borderRadius: radii.sm,
    backgroundColor: colors.brand.brown,
    alignItems: "center",
    justifyContent: "center",
  },
  poweredByText: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
  },
  poweredByBrand: {
    fontWeight: "700",
    color: colors.text.secondary,
  },
});
