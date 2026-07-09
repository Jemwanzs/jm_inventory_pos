import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, StockMovement, listStockMovements } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState } from "../../components/EmptyState";
import { colors, radii, spacing, typography } from "../../theme";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StockMovementsScreen() {
  const { token } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setMovements(await listStockMovements(token));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to reach the server");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.brand.brown} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Stock Movements</Text>
      <Text style={styles.subheading}>Full in/out ledger — most recent 100 entries.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {movements.length === 0 ? (
        <EmptyState
          icon="swap-horizontal-outline"
          title="No stock movements yet"
          description="Movements appear here once stock is added via Inventory > Add Stock."
        />
      ) : (
        <View style={styles.list}>
          {movements.map((m) => (
            <View key={m.id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.product}>{m.product_name}</Text>
                <Text style={styles.meta}>
                  {m.movement_type} · {m.workspace_name} · {m.user_email ?? "system"}
                </Text>
                {m.reason ? <Text style={styles.reason}>{m.reason}</Text> : null}
              </View>
              <View style={styles.qtyWrap}>
                <Text style={styles.qty}>
                  {m.quantity_in !== "0.00" && m.quantity_in !== "0" ? `+${m.quantity_in}` : `-${m.quantity_out}`}
                </Text>
                <Text style={styles.timestamp}>{formatTimestamp(m.created_at)}</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    maxWidth: 720,
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
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowMain: {
    flex: 1,
  },
  product: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  meta: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 1,
  },
  reason: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
    marginTop: 1,
    fontStyle: "italic",
  },
  qtyWrap: {
    alignItems: "flex-end",
  },
  qty: {
    fontSize: typography.body.fontSize - 1,
    fontWeight: "700",
    color: colors.semantic.success,
  },
  timestamp: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
    marginTop: 1,
  },
});
