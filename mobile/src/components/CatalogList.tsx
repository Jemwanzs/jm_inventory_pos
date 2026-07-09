import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "../theme";
import { Button } from "./Button";
import { Card } from "./Card";

interface CatalogListItem {
  id: string;
  name: string;
  subtitle?: string;
}

interface CatalogListProps {
  title: string;
  description: string;
  emptyLabel: string;
  isLoading: boolean;
  error: string | null;
  items: CatalogListItem[];
  formContent: React.ReactNode;
  onAdd: () => void;
  canAdd: boolean;
  isAdding: boolean;
  addLabel: string;
}

export function CatalogList({
  title,
  description,
  emptyLabel,
  isLoading,
  error,
  items,
  formContent,
  onAdd,
  canAdd,
  isAdding,
  addLabel,
}: CatalogListProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subheading}>{description}</Text>

      <Card style={styles.formCard}>
        {formContent}
        <Button label={addLabel} onPress={onAdd} disabled={!canAdd} loading={isAdding} style={styles.addButton} />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="pricetag-outline" size={16} color={colors.brand.brown} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.name}</Text>
                {item.subtitle ? <Text style={styles.rowSubtitle}>{item.subtitle}</Text> : null}
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
  formCard: {
    gap: spacing.xs,
  },
  addButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
  },
  error: {
    color: colors.semantic.danger,
    fontSize: typography.caption.fontSize,
  },
  empty: {
    color: colors.text.muted,
    fontSize: typography.body.fontSize,
    textAlign: "center",
    paddingVertical: spacing.lg,
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
    width: 32,
    height: 32,
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
  rowSubtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 1,
  },
});
