import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, StockBalance, listStockBalances } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, spacing, typography } from "../../theme";

export default function StockBalancesScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      setBalances(await listStockBalances(token));
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

  const totalValue = balances.reduce(
    (sum, b) => sum + parseFloat(b.quantity_available) * parseFloat(b.average_cost),
    0
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Stock Balances</Text>
          <Text style={styles.subheading}>
            {balances.length} in stock · KES {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            total value
          </Text>
        </View>
        <Button label="Add Stock" onPress={() => navigation.navigate("Inventory.AddStock" as never)} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : balances.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="No stock yet"
          description="Add opening stock or a purchase to start tracking balances."
          actionLabel="Add Stock"
          onAction={() => navigation.navigate("Inventory.AddStock" as never)}
        />
      ) : (
        <View style={styles.list}>
          {balances.map((b) => (
            <View key={b.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="cube-outline" size={18} color={colors.brand.brown} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{b.product_name}</Text>
                <Text style={styles.rowMeta}>
                  {b.workspace_name}
                  {b.product_sku ? ` · ${b.product_sku}` : ""}
                </Text>
              </View>
              <View style={styles.qtyWrap}>
                <Text style={styles.qty}>{b.quantity_available}</Text>
                <Text style={styles.avgCost}>avg KES {b.average_cost}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontSize: typography.title.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  subheading: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  error: {
    color: colors.semantic.danger,
    fontSize: typography.caption.fontSize,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.brand.creamDark,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  rowMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 1,
  },
  qtyWrap: {
    alignItems: "flex-end",
  },
  qty: {
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  avgCost: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
    marginTop: 1,
  },
});
