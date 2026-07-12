import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, ApprovalRequest, approveRequest, listPendingApprovals, rejectRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { colors, radii, spacing, typography } from "../../theme";

export default function PendingApprovalsScreen() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      setRequests(await listPendingApprovals(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDecide = async (id: string, approve: boolean) => {
    if (!token) return;
    setError(null);
    setDecidingId(id);
    try {
      if (approve) {
        await approveRequest(id, undefined, token);
      } else {
        await rejectRequest(id, undefined, token);
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Pending Approvals</Text>
      <Text style={styles.subheading}>{requests.length} awaiting a decision</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="checkmark-done-outline"
          title="Nothing pending"
          description="Requests that need your sign-off — like large purchase orders — will show up here."
        />
      ) : (
        <View style={styles.list}>
          {requests.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.semantic.warning} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowDescription}>{r.description}</Text>
                <Text style={styles.rowMeta}>
                  {r.module} · requested by {r.requested_by_email} ·{" "}
                  {new Date(r.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {r.total_steps > 1 ? ` · step ${r.step_order} of ${r.total_steps}` : ""}
                </Text>
              </View>
              <View style={styles.actions}>
                <Button label="Approve" onPress={() => handleDecide(r.id, true)} loading={decidingId === r.id} />
                <Button label="Reject" variant="ghost" onPress={() => handleDecide(r.id, false)} loading={decidingId === r.id} />
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
  heading: {
    fontSize: typography.title.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  subheading: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: -spacing.sm,
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
    backgroundColor: colors.semantic.warningBg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowDescription: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  rowMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
});
