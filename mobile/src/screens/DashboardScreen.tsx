import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, DashboardSummary, getDashboardSummary } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/Card";
import { StatCard } from "../components/StatCard";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

function formatMoney(value: string): string {
  const n = parseFloat(value);
  return `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function DashboardScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setSummary(await getDashboardSummary(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation, load]);

  const stats = summary
    ? [
        { label: "Stock Value", value: formatMoney(summary.stock_value), icon: "cube-outline" as const, tone: "success" as const },
        { label: "Active Products", value: String(summary.product_count), icon: "pricetag-outline" as const, tone: "neutral" as const },
        { label: "Active Workspaces", value: String(summary.workspace_count), icon: "storefront-outline" as const, tone: "neutral" as const },
        { label: "Stock Movements Today", value: String(summary.movements_today), icon: "swap-horizontal-outline" as const, tone: "warning" as const },
      ]
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Overview</Text>
      <Text style={styles.subheading}>Here's what's happening across your business today.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : (
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </View>
      )}

      <Card style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>Sales trends and top products</Text>
        <Text style={styles.placeholderBody}>
          Charts land here once the POS and sales-reporting modules are wired up. Today's Sales and
          Pending Approvals stats will join the summary above once those modules record real data.
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
  error: {
    color: colors.semantic.danger,
    fontSize: typography.caption.fontSize,
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
