import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  ApiError,
  Product,
  PurchaseOrder,
  Supplier,
  Workspace,
  createPurchaseOrder,
  listProducts,
  listPurchaseOrders,
  listSuppliers,
  listWorkspaces,
  receivePurchaseOrder,
} from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { EmptyState } from "../../components/EmptyState";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, spacing, typography } from "../../theme";

interface DraftLine {
  productId: string;
  quantity: string;
  unitCost: string;
}

export default function PurchaseOrdersScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([{ productId: "", quantity: "", unitCost: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [o, s, w, p] = await Promise.all([
        listPurchaseOrders(token),
        listSuppliers(token),
        listWorkspaces(token),
        listProducts(token),
      ]);
      setOrders(o);
      setSuppliers(s.filter((x) => x.is_active));
      setWorkspaces(w.filter((x) => x.is_active));
      setProducts(p.filter((x) => x.is_active));
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

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, { productId: "", quantity: "", unitCost: "" }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setSupplierId("");
    setWorkspaceId("");
    setNotes("");
    setLines([{ productId: "", quantity: "", unitCost: "" }]);
  };

  const canSubmit =
    supplierId.length > 0 &&
    workspaceId.length > 0 &&
    lines.every((l) => l.productId && l.quantity) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createPurchaseOrder(
        {
          supplier_id: supplierId,
          workspace_id: workspaceId,
          notes: notes.trim() || undefined,
          items: lines.map((l) => ({
            product_id: l.productId,
            quantity: l.quantity,
            unit_cost: l.unitCost || "0",
          })),
        },
        token
      );
      resetForm();
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async (id: string) => {
    if (!token) return;
    setReceivingId(id);
    setError(null);
    try {
      await receivePurchaseOrder(id, token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setReceivingId(null);
    }
  };

  const noPrereqs = !isLoading && (suppliers.length === 0 || workspaces.length === 0 || products.length === 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Purchase Orders</Text>
          <Text style={styles.subheading}>{orders.length} total</Text>
        </View>
        {!noPrereqs && <Button label={showForm ? "Cancel" : "New Purchase Order"} onPress={() => setShowForm((v) => !v)} />}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {noPrereqs && (
        <Card>
          <Text style={styles.hint}>
            You need at least one active supplier (Suppliers), one workspace (Settings &gt; Workspaces), and
            one product (Products) before you can create a purchase order.
          </Text>
        </Card>
      )}

      {showForm && (
        <Card style={styles.formCard}>
          <ChipSelect
            label="Supplier"
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            value={supplierId}
            onChange={setSupplierId}
          />
          <ChipSelect
            label="Receiving workspace"
            options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
            value={workspaceId}
            onChange={setWorkspaceId}
          />

          <Text style={styles.linesLabel}>Line items</Text>
          {lines.map((line, index) => (
            <View key={index} style={styles.lineCard}>
              <View style={styles.lineHeader}>
                <Text style={styles.lineIndex}>Item {index + 1}</Text>
                {lines.length > 1 && (
                  <TouchableOpacity onPress={() => removeLine(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.semantic.danger} />
                  </TouchableOpacity>
                )}
              </View>
              <ChipSelect
                label="Product"
                options={products.map((p) => ({ value: p.id, label: p.name }))}
                value={line.productId}
                onChange={(v) => updateLine(index, { productId: v })}
              />
              <View style={styles.row}>
                <View style={styles.field}>
                  <TextField
                    label="Quantity"
                    placeholder="0"
                    value={line.quantity}
                    onChangeText={(t) => updateLine(index, { quantity: t.replace(/[^0-9.]/g, "") })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.field}>
                  <TextField
                    label="Unit cost"
                    placeholder="0.00"
                    value={line.unitCost}
                    onChangeText={(t) => updateLine(index, { unitCost: t.replace(/[^0-9.]/g, "") })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          ))}
          <Button label="Add another line" variant="ghost" onPress={addLine} />

          <TextField label="Notes (optional)" placeholder="Delivery instructions, etc." value={notes} onChangeText={setNotes} />

          <Button label="Create Purchase Order" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
        </Card>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : orders.length === 0 ? (
        !noPrereqs && (
          <EmptyState
            icon="cart-outline"
            title="No purchase orders yet"
            description="Create a purchase order to start recording purchases from your suppliers."
            actionLabel="New Purchase Order"
            onAction={() => setShowForm(true)}
          />
        )
      ) : (
        <View style={styles.list}>
          {orders.map((order) => (
            <View key={order.id} style={styles.row2}>
              <View style={styles.rowIcon}>
                <Ionicons name="cart-outline" size={18} color={colors.brand.brown} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{order.supplier_name}</Text>
                <Text style={styles.rowMeta}>
                  {order.workspace_name} · {order.item_count} item{order.item_count === 1 ? "" : "s"} · KES{" "}
                  {parseFloat(order.total_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.statusWrap}>
                <Text style={[styles.statusTag, order.status === "Received" && styles.statusReceived]}>
                  {order.status}
                </Text>
                {order.status === "Draft" && (
                  <Button
                    label="Receive"
                    variant="ghost"
                    onPress={() => handleReceive(order.id)}
                    loading={receivingId === order.id}
                  />
                )}
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
  hint: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  formCard: {
    gap: spacing.xs,
  },
  linesLabel: {
    fontSize: typography.label.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  lineCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    marginTop: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
  },
  lineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lineIndex: {
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    color: colors.text.secondary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  field: {
    flex: 1,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row2: {
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
  statusWrap: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  statusTag: {
    fontSize: typography.caption.fontSize - 1,
    fontWeight: "700",
    color: colors.semantic.warning,
  },
  statusReceived: {
    color: colors.semantic.success,
  },
});
