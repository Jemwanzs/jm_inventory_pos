import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import {
  ApiError,
  Customer,
  Product,
  Workspace,
  createSale,
  listCustomers,
  listProducts,
  listWorkspaces,
} from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, spacing, typography } from "../../theme";

interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

const PAYMENT_METHODS = ["Cash", "M-Pesa", "Card", "Bank", "Credit"].map((v) => ({ value: v, label: v }));

export default function POSTerminalScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [workspaceId, setWorkspaceId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const unsubscribe = navigation.addListener("focus", () => {
      setIsLoading(true);
      Promise.all([listWorkspaces(token), listProducts(token), listCustomers(token)])
        .then(([w, p, c]) => {
          setWorkspaces(w.filter((x) => x.is_active));
          setProducts(p.filter((x) => x.is_active));
          setCustomers(c.filter((x) => x.is_active));
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the server"))
        .finally(() => setIsLoading(false));
    });
    return unsubscribe;
  }, [navigation, token]);

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase().trim()));

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, name: product.name, quantity: 1, unitPrice: parseFloat(product.selling_price) }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (productId: string) => setCart((prev) => prev.filter((l) => l.productId !== productId));

  const total = cart.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  const canCheckout = workspaceId.length > 0 && cart.length > 0 && !isSubmitting;

  const handleCheckout = async () => {
    if (!token) return;
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const result = await createSale(
        {
          workspace_id: workspaceId,
          customer_id: customerId || undefined,
          payment_method: paymentMethod,
          amount_paid: amountPaid || total.toFixed(2),
          items: cart.map((l) => ({
            product_id: l.productId,
            quantity: String(l.quantity),
            unit_price: String(l.unitPrice),
          })),
        },
        token
      );
      setSuccess(`Sale completed — total KES ${result.total}`);
      setCart([]);
      setAmountPaid("");
      setCustomerId("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.brand.brown} />
      </View>
    );
  }

  if (workspaces.length === 0 || products.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>POS Terminal</Text>
        <Card>
          <Text style={styles.hint}>
            {workspaces.length === 0 && "You need at least one workspace (Settings > Workspaces) "}
            {workspaces.length === 0 && products.length === 0 && "and "}
            {products.length === 0 && "at least one product with stock (Products, then Inventory > Add Stock) "}
            before you can sell.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>POS Terminal</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Card style={styles.card}>
        <ChipSelect
          label="Workspace"
          options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
          value={workspaceId}
          onChange={setWorkspaceId}
        />
        {customers.length > 0 && (
          <ChipSelect
            label="Customer (optional — walk-in if unset)"
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
            value={customerId}
            onChange={(v) => setCustomerId(v === customerId ? "" : v)}
          />
        )}
      </Card>

      <Card style={styles.card}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products to add…"
            placeholderTextColor={colors.text.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={styles.productGrid}>
          {filteredProducts.map((p) => (
            <TouchableOpacity key={p.id} style={styles.productChip} onPress={() => addToCart(p)}>
              <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.productPrice}>KES {p.selling_price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cartTitle}>Cart</Text>
        {cart.length === 0 ? (
          <Text style={styles.hint}>Tap a product above to add it to the cart.</Text>
        ) : (
          <View style={styles.list}>
            {cart.map((line) => (
              <View key={line.productId} style={styles.cartRow}>
                <View style={styles.cartRowText}>
                  <Text style={styles.cartName}>{line.name}</Text>
                  <Text style={styles.cartMeta}>KES {line.unitPrice.toFixed(2)} each</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => changeQuantity(line.productId, -1)} style={styles.qtyButton}>
                    <Ionicons name="remove" size={14} color={colors.brand.brown} />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{line.quantity}</Text>
                  <TouchableOpacity onPress={() => changeQuantity(line.productId, 1)} style={styles.qtyButton}>
                    <Ionicons name="add" size={14} color={colors.brand.brown} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.lineTotal}>KES {(line.quantity * line.unitPrice).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeLine(line.productId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={16} color={colors.semantic.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.total}>Total: KES {total.toFixed(2)}</Text>

        <ChipSelect label="Payment method" options={PAYMENT_METHODS} value={paymentMethod} onChange={setPaymentMethod} />
        <TextField
          label="Amount paid"
          placeholder={total.toFixed(2)}
          value={amountPaid}
          onChangeText={(t) => setAmountPaid(t.replace(/[^0-9.]/g, ""))}
          keyboardType="decimal-pad"
        />

        <Button label="Checkout" onPress={handleCheckout} disabled={!canCheckout} loading={isSubmitting} />
      </Card>
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
  error: {
    color: colors.semantic.danger,
    fontSize: typography.caption.fontSize,
  },
  success: {
    color: colors.semantic.success,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  hint: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  card: {
    gap: spacing.xs,
  },
  searchWrap: {
    position: "relative",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  searchIcon: {
    position: "absolute",
    left: spacing.md,
    zIndex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingLeft: spacing.xl + spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.surfaceAlt,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  productChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    minWidth: 140,
  },
  productName: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  productPrice: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.secondary,
    marginTop: 1,
  },
  cartTitle: {
    fontSize: typography.subheading.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  list: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cartRowText: {
    flex: 1,
  },
  cartName: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  cartMeta: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  qtyButton: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: {
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
    minWidth: 18,
    textAlign: "center",
  },
  lineTotal: {
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
    minWidth: 80,
    textAlign: "right",
  },
  total: {
    fontSize: typography.subheading.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "right",
    marginTop: spacing.xs,
  },
});
