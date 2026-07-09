import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ApiError,
  CatalogItem,
  UnitItem,
  createProduct,
  listBrands,
  listCategories,
  listUnits,
} from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing, typography } from "../../theme";

export default function AddProductScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [brands, setBrands] = useState<CatalogItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    listCategories(token).then(setCategories).catch(() => {});
    listBrands(token).then(setBrands).catch(() => {});
    listUnits(token).then(setUnits).catch(() => {});
  }, [token]);

  const canSubmit = name.trim().length > 0 && costPrice.length > 0 && sellingPrice.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createProduct(
        {
          name: name.trim(),
          sku: sku.trim() || undefined,
          barcode: barcode.trim() || undefined,
          category_id: categoryId || undefined,
          brand_id: brandId || undefined,
          unit_id: unitId || undefined,
          cost_price: costPrice || "0",
          selling_price: sellingPrice || "0",
        },
        token
      );
      navigation.navigate("Products.List" as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Add Product</Text>
      <Text style={styles.subheading}>Name, SKU/barcode, category, brand, unit, and pricing.</Text>

      <Card style={styles.card}>
        <TextField label="Product name" placeholder="iPhone 17" value={name} onChangeText={setName} />
        <TextField label="SKU (optional)" placeholder="IPH17-256-BLK" value={sku} onChangeText={setSku} />
        <TextField label="Barcode (optional)" placeholder="6009123456789" value={barcode} onChangeText={setBarcode} />

        {categories.length > 0 && (
          <ChipSelect
            label="Category"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
          />
        )}
        {brands.length > 0 && (
          <ChipSelect
            label="Brand"
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
            value={brandId}
            onChange={setBrandId}
          />
        )}
        {units.length > 0 && (
          <ChipSelect
            label="Unit"
            options={units.map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }))}
            value={unitId}
            onChange={setUnitId}
          />
        )}
        {categories.length === 0 && brands.length === 0 && units.length === 0 && (
          <Text style={styles.hint}>
            No categories, brands, or units yet — add some under Products first, or leave these unset for now.
          </Text>
        )}

        <View style={styles.priceRow}>
          <View style={styles.priceField}>
            <TextField
              label="Cost price"
              placeholder="0.00"
              value={costPrice}
              onChangeText={(t) => setCostPrice(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.priceField}>
            <TextField
              label="Selling price"
              placeholder="0.00"
              value={sellingPrice}
              onChangeText={(t) => setSellingPrice(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Save Product" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
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
    fontSize: typography.caption.fontSize,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  priceField: {
    flex: 1,
  },
  error: {
    color: colors.semantic.danger,
    marginBottom: spacing.sm + 4,
    fontSize: typography.caption.fontSize,
  },
});
