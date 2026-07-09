import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { ApiError, CustomField, createCustomField, listCustomFields, updateCustomField } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import { colors, radii, spacing, typography } from "../../theme";

// See components/SettingsToggle.tsx for why this is needed on web.
const webAccentStyle = Platform.OS === "web" ? ({ accentColor: colors.brand.brown } as object) : undefined;

const MODULES = [
  { value: "products", label: "Products" },
  { value: "customers", label: "Customers" },
  { value: "suppliers", label: "Suppliers" },
  { value: "sales", label: "Sales" },
  { value: "purchases", label: "Purchases" },
];

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File" },
];

export default function CustomFieldsScreen() {
  const { token } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [module, setModule] = useState("products");
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      setFields(await listCustomFields(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!token || fieldName.trim().length === 0) return;
    setIsCreating(true);
    setError(null);
    try {
      const field = await createCustomField(
        { module, field_name: fieldName.trim(), field_type: fieldType, is_required: false },
        token
      );
      setFields((prev) => [...prev, field]);
      setFieldName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (field: CustomField) => {
    if (!token) return;
    const next = !field.is_active;
    setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, is_active: next } : f)));
    try {
      await updateCustomField(field.id, next, token);
    } catch (err) {
      setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, is_active: !next } : f)));
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Custom Fields</Text>
      <Text style={styles.subheading}>Extra fields your business needs that aren't built in.</Text>

      <Card style={styles.formCard}>
        <ChipSelect label="Applies to" options={MODULES} value={module} onChange={setModule} />
        <TextField label="Field name" placeholder="IMEI Number" value={fieldName} onChangeText={setFieldName} />
        <ChipSelect label="Field type" options={FIELD_TYPES} value={fieldType} onChange={setFieldType} />
        <Button
          label="Add Field"
          onPress={handleCreate}
          disabled={fieldName.trim().length === 0 || isCreating}
          loading={isCreating}
          style={styles.addButton}
        />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : fields.length === 0 ? (
        <Text style={styles.empty}>No custom fields yet — add your first one above.</Text>
      ) : (
        <View style={styles.list}>
          {fields.map((field) => (
            <View key={field.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="add-circle-outline" size={18} color={colors.brand.brown} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{field.field_name}</Text>
                <Text style={styles.rowType}>
                  {field.module} · {field.field_type}
                </Text>
              </View>
              <Switch
                value={field.is_active}
                onValueChange={() => handleToggleActive(field)}
                trackColor={{ false: colors.border, true: colors.brand.brown }}
                thumbColor={colors.surface}
                style={webAccentStyle}
              />
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
  rowType: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 1,
  },
});
