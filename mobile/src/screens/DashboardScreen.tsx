import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "../components/Card";
import { StatCard } from "../components/StatCard";
import { colors, spacing, typography } from "../theme";

// Mock data — replace with live values from GET /reports/... once the
// reporting endpoints exist (see docs/backend-architecture.md#api-structure).
const STATS = [
  { label: "Today's Sales", value: "KES 0", icon: "cash-outline" as const, tone: "success" as const },
  { label: "Stock Value", value: "KES 0", icon: "cube-outline" as const, tone: "neutral" as const },
  { label: "Low Stock Items", value: "0", icon: "alert-circle-outline" as const, tone: "warning" as const },
  { label: "Pending Approvals", value: "0", icon: "checkmark-done-outline" as const, tone: "danger" as const },
];

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Overview</Text>
      <Text style={styles.subheading}>Here's what's happening across your business today.</Text>

      <View style={styles.statsGrid}>
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </View>

      <Card style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>Sales trends and top products</Text>
        <Text style={styles.placeholderBody}>
          Charts land here once the sales and reporting APIs are wired up (see the V1 roadmap).
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heading: {
    fontSize: typography.title.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  subheading: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
    marginTop: -spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  placeholderCard: {
    gap: spacing.xs,
  },
  placeholderTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  placeholderBody: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
});
