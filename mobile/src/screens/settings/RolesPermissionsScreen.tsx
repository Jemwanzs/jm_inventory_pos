import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { ApiError, RolesMatrix, getRolesMatrix, updateRolePermissions } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { colors, radii, spacing, typography } from "../../theme";

const webAccentStyle = Platform.OS === "web" ? ({ accentColor: colors.brand.brown } as object) : undefined;

function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function RolesPermissionsScreen() {
  const { token } = useAuth();
  const [matrix, setMatrix] = useState<RolesMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await getRolesMatrix(token);
      setMatrix(data);
      const firstRole = data.roles[0]?.id ?? null;
      setSelectedRoleId((prev) => prev ?? firstRole);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!matrix || !selectedRoleId) return;
    const assigned = matrix.assignments
      .filter((a) => a.role_id === selectedRoleId)
      .map((a) => a.permission_id);
    setCheckedIds(new Set(assigned));
  }, [matrix, selectedRoleId]);

  const grouped = useMemo(() => {
    if (!matrix) return [];
    const byModule = new Map<string, typeof matrix.permissions>();
    for (const permission of matrix.permissions) {
      const [module] = permission.code.split(".");
      if (!byModule.has(module)) byModule.set(module, []);
      byModule.get(module)!.push(permission);
    }
    return [...byModule.entries()];
  }, [matrix]);

  const toggle = (permissionId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!token || !selectedRoleId) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateRolePermissions(selectedRoleId, [...checkedIds], token);
      setMatrix((prev) =>
        prev
          ? {
              ...prev,
              assignments: [
                ...prev.assignments.filter((a) => a.role_id !== selectedRoleId),
                ...[...checkedIds].map((permission_id) => ({ role_id: selectedRoleId, permission_id })),
              ],
            }
          : prev
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !matrix) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.brand.brown} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Roles &amp; Permissions</Text>
      <Text style={styles.subheading}>Pick a role, then choose what it can do in each module.</Text>

      <ChipSelect
        label="Role"
        options={matrix.roles.map((r) => ({ value: r.id, label: r.name }))}
        value={selectedRoleId ?? ""}
        onChange={setSelectedRoleId}
      />

      {matrix.roles.length === 0 ? (
        <Text style={styles.empty}>No tenant roles yet.</Text>
      ) : (
        <Card style={styles.matrixCard}>
          {grouped.map(([module, permissions]) => (
            <View key={module} style={styles.moduleGroup}>
              <Text style={styles.moduleTitle}>{titleCase(module)}</Text>
              {permissions.map((permission) => (
                <View key={permission.id} style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>{permission.description ?? permission.code}</Text>
                  <Switch
                    value={checkedIds.has(permission.id)}
                    onValueChange={() => toggle(permission.id)}
                    trackColor={{ false: colors.border, true: colors.brand.brown }}
                    thumbColor={colors.surface}
                    style={webAccentStyle}
                  />
                </View>
              ))}
            </View>
          ))}
        </Card>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={saved ? "Saved!" : "Save Changes"}
        onPress={handleSave}
        loading={isSaving}
        disabled={!selectedRoleId}
        style={styles.saveButton}
      />
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
  empty: {
    color: colors.text.muted,
    fontSize: typography.body.fontSize,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  matrixCard: {
    gap: spacing.md,
  },
  moduleGroup: {
    gap: 2,
  },
  moduleTitle: {
    fontSize: typography.label.fontSize,
    fontWeight: "700",
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  permissionLabel: {
    flex: 1,
    fontSize: typography.body.fontSize - 1,
    color: colors.text.primary,
    paddingRight: spacing.md,
  },
  error: {
    color: colors.semantic.danger,
    fontSize: typography.caption.fontSize,
  },
  saveButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xl,
  },
});
