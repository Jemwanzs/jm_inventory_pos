import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { ApiError, Workspace, createWorkspace, listWorkspaces, updateWorkspace } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import { colors, radii, spacing, typography } from "../../theme";

// See components/SettingsToggle.tsx for why this is needed on web.
const webAccentStyle = Platform.OS === "web" ? ({ accentColor: colors.brand.brown } as object) : undefined;

const WORKSPACE_TYPES = [
  { value: "Branch", label: "Branch" },
  { value: "Warehouse", label: "Warehouse" },
  { value: "Store", label: "Store" },
  { value: "POS Counter", label: "POS Counter" },
  { value: "Restaurant Floor", label: "Restaurant Floor" },
];

export default function WorkspacesScreen() {
  const { token } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("Branch");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      setWorkspaces(await listWorkspaces(token));
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
    if (!token || name.trim().length === 0) return;
    setIsCreating(true);
    setError(null);
    try {
      const workspace = await createWorkspace(name.trim(), type, token);
      setWorkspaces((prev) => [...prev, workspace]);
      setName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (workspace: Workspace) => {
    if (!token) return;
    const next = !workspace.is_active;
    setWorkspaces((prev) => prev.map((w) => (w.id === workspace.id ? { ...w, is_active: next } : w)));
    try {
      await updateWorkspace(workspace.id, { is_active: next }, token);
    } catch (err) {
      setWorkspaces((prev) => prev.map((w) => (w.id === workspace.id ? { ...w, is_active: !next } : w)));
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Workspaces</Text>
      <Text style={styles.subheading}>Branches, stores, warehouses, and POS counters.</Text>

      <Card style={styles.formCard}>
        <TextField label="Name" placeholder="Main Branch" value={name} onChangeText={setName} />
        <ChipSelect label="Type" options={WORKSPACE_TYPES} value={type} onChange={setType} />
        <Button
          label="Add Workspace"
          onPress={handleCreate}
          disabled={name.trim().length === 0 || isCreating}
          loading={isCreating}
          style={styles.addButton}
        />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : workspaces.length === 0 ? (
        <Text style={styles.empty}>No workspaces yet — add your first branch or store above.</Text>
      ) : (
        <View style={styles.list}>
          {workspaces.map((workspace) => (
            <View key={workspace.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="business-outline" size={18} color={colors.brand.brown} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{workspace.name}</Text>
                <Text style={styles.rowType}>{workspace.type}</Text>
              </View>
              <Switch
                value={workspace.is_active}
                onValueChange={() => handleToggleActive(workspace)}
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
