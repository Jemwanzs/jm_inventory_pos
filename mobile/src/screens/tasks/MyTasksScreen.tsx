import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, Task, listMyTasks } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState } from "../../components/EmptyState";
import { colors, radii, spacing, typography } from "../../theme";

const priorityColor: Record<string, string> = {
  Low: colors.text.muted,
  Medium: colors.semantic.warning,
  High: colors.semantic.danger,
};

export default function MyTasksScreen() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listMyTasks(token)
      .then(setTasks)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to reach the server"))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>My Tasks</Text>
      <Text style={styles.subheading}>{tasks.length} assigned to you</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="checkbox-outline"
          title="Nothing assigned to you"
          description="Tasks you're assigned show up here, soonest due date first."
        />
      ) : (
        <View style={styles.list}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.row}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor[task.priority] }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{task.title}</Text>
                <Text style={styles.rowMeta}>
                  {task.status}
                  {task.due_date ? ` · due ${task.due_date}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color={colors.text.muted} />
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
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  rowMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 1,
  },
});
