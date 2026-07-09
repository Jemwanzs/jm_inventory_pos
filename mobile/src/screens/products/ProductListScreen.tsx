import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError, Product, listProducts } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, spacing, typography } from "../../theme";

export default function ProductListScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      setProducts(await listProducts(token));
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

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase().trim()));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Products</Text>
          <Text style={styles.subheading}>{products.length} total</Text>
        </View>
        <Button label="Add Product" onPress={() => navigation.navigate("Products.Add" as never)} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products…"
          placeholderTextColor={colors.text.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="pricetag-outline"
          title={products.length === 0 ? "No products yet" : "No matches"}
          description={
            products.length === 0
              ? "Add your first product to start building the catalog."
              : "Try a different search term."
          }
          actionLabel={products.length === 0 ? "Add Product" : undefined}
          onAction={products.length === 0 ? () => navigation.navigate("Products.Add" as never) : undefined}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((product) => (
            <View key={product.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="cube-outline" size={18} color={colors.brand.brown} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{product.name}</Text>
                <Text style={styles.rowMeta}>
                  {[product.sku, product.category_name, product.brand_name].filter(Boolean).join(" · ") ||
                    "No SKU / category / brand set"}
                </Text>
              </View>
              <View style={styles.priceWrap}>
                <Text style={styles.price}>KES {product.selling_price}</Text>
                {!product.is_active && <Text style={styles.inactiveTag}>Inactive</Text>}
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
  searchWrap: {
    position: "relative",
    justifyContent: "center",
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
  priceWrap: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: typography.body.fontSize - 1,
    fontWeight: "700",
    color: colors.text.primary,
  },
  inactiveTag: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.semantic.danger,
    marginTop: 1,
  },
});
