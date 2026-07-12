import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ApiError,
  ProductionOrder,
  Recipe,
  Workspace,
  createProductionOrder,
  listProductionOrders,
  listRecipes,
  listWorkspaces,
} from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { EmptyState } from "../../components/EmptyState";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, spacing, typography } from "../../theme";

export default function ProductionOrdersScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recipeId, setRecipeId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [o, r, w] = await Promise.all([listProductionOrders(token), listRecipes(token), listWorkspaces(token)]);
      setOrders(o);
      setRecipes(r.filter((x) => x.is_active));
      setWorkspaces(w.filter((x) => x.is_active));
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

  const noPrereqs = !isLoading && (recipes.length === 0 || workspaces.length === 0);
  const canSubmit = recipeId.length > 0 && workspaceId.length > 0 && quantity.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createProductionOrder(recipeId, workspaceId, quantity, token);
      setQuantity("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Production Orders</Text>
      <Text style={styles.subheading}>{orders.length} total</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : noPrereqs ? (
        <Card>
          <Text style={styles.hint}>
            {recipes.length === 0 && "You need at least one recipe (Production > Recipes) "}
            {recipes.length === 0 && workspaces.length === 0 && "and "}
            {workspaces.length === 0 && "at least one workspace (Settings > Workspaces) "}
            before you can run a production order.
          </Text>
        </Card>
      ) : (
        <Card style={styles.card}>
          <ChipSelect
            label="Recipe"
            options={recipes.map((r) => ({ value: r.id, label: `${r.name} → ${r.product_name}` }))}
            value={recipeId}
            onChange={setRecipeId}
          />
          <ChipSelect
            label="Workspace"
            options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
            value={workspaceId}
            onChange={setWorkspaceId}
          />
          <TextField
            label="Quantity to produce"
            placeholder="0"
            value={quantity}
            onChangeText={(t) => setQuantity(t.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
          />
          <Button label="Run Production Order" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
        </Card>
      )}

      {orders.length === 0 ? (
        !noPrereqs && !isLoading && (
          <EmptyState
            icon="construct-outline"
            title="No production runs yet"
            description="Run a production order above to consume ingredients and add finished stock."
          />
        )
      ) : (
        <View style={styles.list}>
          {orders.map((o) => (
            <View key={o.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="construct-outline" size={18} color={colors.brand.brown} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{o.recipe_name}</Text>
                <Text style={styles.rowMeta}>
                  {o.workspace_name} · {o.quantity_produced} produced · unit cost KES {o.unit_cost}
                </Text>
              </View>
              <Text style={styles.timestamp}>
                {new Date(o.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </Text>
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
  heading: {
    fontSize: typography.title.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  subheading: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: -spacing.sm,
  },
  error: {
    color: colors.semantic.danger,
    fontSize: typography.caption.fontSize,
  },
  hint: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  card: {
    gap: spacing.xs,
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
  timestamp: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
  },
});
