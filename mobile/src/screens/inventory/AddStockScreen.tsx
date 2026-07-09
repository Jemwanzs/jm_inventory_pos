import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, Product, Workspace, addStock, listProducts, listWorkspaces } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing, typography } from "../../theme";

const MOVEMENT_TYPES = [
  { value: "Opening Stock", label: "Opening Stock" },
  { value: "Purchase", label: "Purchase" },
];

export default function AddStockScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [workspaceId, setWorkspaceId] = useState("");
  const [productId, setProductId] = useState("");
  const [movementType, setMovementType] = useState("Purchase");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([listWorkspaces(token), listProducts(token)])
      .then(([w, p]) => {
        setWorkspaces(w.filter((ws) => ws.is_active));
        setProducts(p.filter((prod) => prod.is_active));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the server"))
      .finally(() => setIsLoadingOptions(false));
  }, [token]);

  const canSubmit =
    workspaceId.length > 0 && productId.length > 0 && quantity.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await addStock(
        {
          workspace_id: workspaceId,
          product_id: productId,
          movement_type: movementType,
          quantity,
          unit_cost: unitCost || undefined,
          reason: reason.trim() || undefined,
        },
        token
      );
      navigation.navigate("Inventory.Balances" as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoadingOptions && (workspaces.length === 0 || products.length === 0)) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Add Stock</Text>
        <Card style={styles.card}>
          <Text style={styles.hint}>
            {workspaces.length === 0 && "You need at least one workspace (Settings > Workspaces) "}
            {workspaces.length === 0 && products.length === 0 && "and "}
            {products.length === 0 && "at least one product (Products > Add Product) "}
            before you can add stock.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Add Stock</Text>
      <Text style={styles.subheading}>Record opening stock or a new purchase.</Text>

      <Card style={styles.card}>
        <ChipSelect
          label="Workspace"
          options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
          value={workspaceId}
          onChange={setWorkspaceId}
        />
        <ChipSelect
          label="Product"
          options={products.map((p) => ({ value: p.id, label: p.name }))}
          value={productId}
          onChange={setProductId}
        />
        <ChipSelect label="Type" options={MOVEMENT_TYPES} value={movementType} onChange={setMovementType} />

        <View style={styles.row}>
          <View style={styles.field}>
            <TextField
              label="Quantity"
              placeholder="0"
              value={quantity}
              onChangeText={(t) => setQuantity(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.field}>
            <TextField
              label="Unit cost (optional)"
              placeholder="0.00"
              value={unitCost}
              onChangeText={(t) => setUnitCost(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <TextField label="Reason / note (optional)" placeholder="Initial stock count" value={reason} onChangeText={setReason} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Add Stock" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
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
    maxWidth: 560,
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
  card: {
    gap: spacing.xs,
  },
  hint: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  field: {
    flex: 1,
  },
  error: {
    color: colors.semantic.danger,
    marginBottom: spacing.sm + 4,
    fontSize: typography.caption.fontSize,
  },
});
