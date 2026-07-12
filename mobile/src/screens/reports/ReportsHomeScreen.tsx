import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, ReportsSummary, getReportsSummary } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Card } from "../../components/Card";
import { StatCard } from "../../components/StatCard";
import { colors, radii, spacing, typography } from "../../theme";

function money(value: string): string {
  const n = parseFloat(value);
  return `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function ReportsHomeScreen() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getReportsSummary(token)
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the server"))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Reports & Analytics</Text>
      <Text style={styles.subheading}>A cross-module rollup of revenue, cost, and stock.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : summary ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard label="Total Revenue" value={money(summary.total_revenue)} icon="cash-outline" tone="success" />
            <StatCard label="Gross Profit" value={money(summary.gross_profit)} icon="trending-up-outline" tone="success" />
            <StatCard label="Total COGS" value={money(summary.total_cogs)} icon="pricetags-outline" tone="warning" />
            <StatCard label="Total Purchases" value={money(summary.total_purchases)} icon="cart-outline" tone="neutral" />
            <StatCard label="Sales Count" value={String(summary.sales_count)} icon="receipt-outline" tone="neutral" />
            <StatCard label="Current Stock Value" value={money(summary.stock_value)} icon="cube-outline" tone="neutral" />
          </View>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Top Products by Revenue</Text>
            {summary.top_products.length === 0 ? (
              <Text style={styles.hint}>No sales recorded yet — top products will appear here once POS checkout is used.</Text>
            ) : (
              <View style={styles.list}>
                {summary.top_products.map((p) => (
                  <View key={p.product_name} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowName}>{p.product_name}</Text>
                      <Text style={styles.rowMeta}>{p.quantity_sold} sold</Text>
                    </View>
                    <Text style={styles.revenue}>{money(p.revenue)}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </>
      ) : null}
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
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
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
  card: {
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.subheading.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  hint: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  list: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  rowMeta: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
  },
  revenue: {
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
