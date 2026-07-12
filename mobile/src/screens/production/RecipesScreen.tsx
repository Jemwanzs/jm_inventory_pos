import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ApiError, Product, Recipe, createRecipe, listProducts, listRecipes } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { EmptyState } from "../../components/EmptyState";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, spacing, typography } from "../../theme";

interface DraftIngredient {
  productId: string;
  quantityPerUnit: string;
}

export default function RecipesScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([{ productId: "", quantityPerUnit: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [r, p] = await Promise.all([listRecipes(token), listProducts(token)]);
      setRecipes(r);
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

  const updateIngredient = (index: number, patch: Partial<DraftIngredient>) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  };
  const addIngredient = () => setIngredients((prev) => [...prev, { productId: "", quantityPerUnit: "" }]);
  const removeIngredient = (index: number) => setIngredients((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setName("");
    setProductId("");
    setIngredients([{ productId: "", quantityPerUnit: "" }]);
  };

  const canSubmit =
    name.trim().length > 0 &&
    productId.length > 0 &&
    ingredients.every((i) => i.productId && i.quantityPerUnit) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createRecipe(
        {
          product_id: productId,
          name: name.trim(),
          ingredients: ingredients.map((i) => ({ product_id: i.productId, quantity_per_unit: i.quantityPerUnit })),
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Recipes / BOM</Text>
          <Text style={styles.subheading}>{recipes.length} total</Text>
        </View>
        {products.length > 0 && <Button label={showForm ? "Cancel" : "New Recipe"} onPress={() => setShowForm((v) => !v)} />}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isLoading && products.length === 0 && (
        <Card>
          <Text style={styles.hint}>You need at least one product (Products) before you can define a recipe.</Text>
        </Card>
      )}

      {showForm && (
        <Card style={styles.formCard}>
          <TextField label="Recipe name" placeholder="House Blend Coffee" value={name} onChangeText={setName} />
          <ChipSelect
            label="Finished product"
            options={products.map((p) => ({ value: p.id, label: p.name }))}
            value={productId}
            onChange={setProductId}
          />

          <Text style={styles.linesLabel}>Ingredients (quantity needed per 1 unit produced)</Text>
          {ingredients.map((ing, index) => (
            <View key={index} style={styles.lineCard}>
              <View style={styles.lineHeader}>
                <Text style={styles.lineIndex}>Ingredient {index + 1}</Text>
                {ingredients.length > 1 && (
                  <TouchableOpacity onPress={() => removeIngredient(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.semantic.danger} />
                  </TouchableOpacity>
                )}
              </View>
              <ChipSelect
                label="Raw material"
                options={products.filter((p) => p.id !== productId).map((p) => ({ value: p.id, label: p.name }))}
                value={ing.productId}
                onChange={(v) => updateIngredient(index, { productId: v })}
              />
              <TextField
                label="Quantity per unit"
                placeholder="0"
                value={ing.quantityPerUnit}
                onChangeText={(t) => updateIngredient(index, { quantityPerUnit: t.replace(/[^0-9.]/g, "") })}
                keyboardType="decimal-pad"
              />
            </View>
          ))}
          <Button label="Add another ingredient" variant="ghost" onPress={addIngredient} />

          <Button label="Save Recipe" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
        </Card>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : recipes.length === 0 ? (
        products.length > 0 && (
          <EmptyState
            icon="flask-outline"
            title="No recipes yet"
            description="Define a recipe to link raw materials to a finished product."
            actionLabel="New Recipe"
            onAction={() => setShowForm(true)}
          />
        )
      ) : (
        <View style={styles.list}>
          {recipes.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="flask-outline" size={18} color={colors.brand.brown} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{r.name}</Text>
                <Text style={styles.rowMeta}>
                  Makes {r.product_name} · {r.ingredient_count} ingredient{r.ingredient_count === 1 ? "" : "s"}
                </Text>
              </View>
              {!r.is_active && <Text style={styles.inactiveTag}>Inactive</Text>}
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
  inactiveTag: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.semantic.danger,
  },
});
