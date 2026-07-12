import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, ApprovalRequest, listMyApprovalRequests } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState } from "../../components/EmptyState";
import { colors, radii, spacing, typography } from "../../theme";

export default function MyRequestsScreen() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listMyApprovalRequests(token)
      .then(setRequests)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the server"))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>My Requests</Text>
      <Text style={styles.subheading}>{requests.length} total</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="paper-plane-outline"
          title="No requests yet"
          description="Approval requests you trigger — like a large purchase order — will show up here with their status."
        />
      ) : (
        <View style={styles.list}>
          {requests.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="paper-plane-outline" size={18} color={colors.brand.brown} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowDescription}>{r.description}</Text>
                <Text style={styles.rowMeta}>
                  {r.module} ·{" "}
                  {new Date(r.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {r.decided_by_email ? ` · decided by ${r.decided_by_email}` : ""}
                  {r.status === "Pending" && r.total_steps > 1 ? ` · step ${r.step_order} of ${r.total_steps}` : ""}
                </Text>
              </View>
              <Text
                style={[
                  styles.statusTag,
                  r.status === "Approved" && styles.statusApproved,
                  r.status === "Rejected" && styles.statusRejected,
                ]}
              >
                {r.status}
              </Text>
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
    backgroundColor: colors.brand.creamDark,
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
  statusTag: {
    fontSize: typography.caption.fontSize - 1,
    fontWeight: "700",
    color: colors.semantic.warning,
  },
  statusApproved: {
    color: colors.semantic.success,
  },
  statusRejected: {
    color: colors.semantic.danger,
  },
});
