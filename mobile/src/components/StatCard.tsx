import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "../theme";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: "neutral" | "success" | "warning" | "danger";
}

const toneColors: Record<NonNullable<StatCardProps["tone"]>, { bg: string; fg: string }> = {
  neutral: { bg: colors.brand.creamDark, fg: colors.brand.brown },
  success: { bg: colors.semantic.successBg, fg: colors.semantic.success },
  warning: { bg: colors.semantic.warningBg, fg: colors.semantic.warning },
  danger: { bg: colors.semantic.dangerBg, fg: colors.semantic.danger },
};

export function StatCard({ label, value, icon, tone = "neutral" }: StatCardProps) {
  const toneColor = toneColors[tone];

  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: toneColor.bg }]}>
        <Ionicons name={icon} size={20} color={toneColor.fg} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 160,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: typography.title.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  label: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
});
