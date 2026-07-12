import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ApiError, Task, createTask, getUserIdFromToken, listTasks, updateTaskStatus } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import { colors, radii, spacing, typography } from "../../theme";

const STATUSES = ["To Do", "In Progress", "Done"] as const;
const PRIORITIES = ["Low", "Medium", "High"].map((v) => ({ value: v, label: v }));

const priorityColor: Record<string, string> = {
  Low: colors.text.muted,
  Medium: colors.semantic.warning,
  High: colors.semantic.danger,
};

export default function TaskBoardScreen() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignToMe, setAssignToMe] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      setTasks(await listTasks(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const userId = getUserIdFromToken(token);
      await createTask(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          assigned_to: assignToMe && userId ? userId : undefined,
          due_date: dueDate.trim() || undefined,
        },
        token
      );
      setTitle("");
      setDescription("");
      setDueDate("");
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const move = async (task: Task, toStatus: string) => {
    if (!token) return;
    setMovingId(task.id);
    setError(null);
    try {
      await updateTaskStatus(task.id, toStatus, token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setMovingId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Task Board</Text>
          <Text style={styles.subheading}>{tasks.length} total</Text>
        </View>
        <Button label={showForm ? "Cancel" : "New Task"} onPress={() => setShowForm((v) => !v)} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showForm && (
        <Card style={styles.formCard}>
          <TextField label="Title" placeholder="Follow up with supplier" value={title} onChangeText={setTitle} />
          <TextField label="Description (optional)" placeholder="Details…" value={description} onChangeText={setDescription} />
          <ChipSelect label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
          <ChipSelect
            label="Assignee"
            options={[
              { value: "me", label: "Me" },
              { value: "unassigned", label: "Unassigned" },
            ]}
            value={assignToMe ? "me" : "unassigned"}
            onChange={(v) => setAssignToMe(v === "me")}
          />
          <TextField label="Due date (optional, YYYY-MM-DD)" placeholder="2026-08-01" value={dueDate} onChangeText={setDueDate} />
          <Button label="Create Task" onPress={handleSubmit} disabled={!title.trim() || isSubmitting} loading={isSubmitting} />
        </Card>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : (
        <View style={styles.board}>
          {STATUSES.map((status) => (
            <View key={status} style={styles.column}>
              <Text style={styles.columnTitle}>
                {status} · {tasks.filter((t) => t.status === status).length}
              </Text>
              <View style={styles.columnBody}>
                {tasks
                  .filter((t) => t.status === status)
                  .map((task) => {
                    const currentIndex = STATUSES.indexOf(status);
                    return (
                      <View key={task.id} style={styles.taskCard}>
                        <View style={styles.taskHeader}>
                          <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
                          <View style={[styles.priorityDot, { backgroundColor: priorityColor[task.priority] }]} />
                        </View>
                        {task.description ? (
                          <Text style={styles.taskDescription} numberOfLines={2}>{task.description}</Text>
                        ) : null}
                        <Text style={styles.taskMeta}>
                          {task.assigned_to_email ?? "Unassigned"}
                          {task.due_date ? ` · due ${task.due_date}` : ""}
                        </Text>
                        <View style={styles.moveRow}>
                          {currentIndex > 0 && (
                            <TouchableOpacity
                              style={styles.moveButton}
                              onPress={() => move(task, STATUSES[currentIndex - 1])}
                              disabled={movingId === task.id}
                              accessibilityLabel={`Move "${task.title}" back to ${STATUSES[currentIndex - 1]}`}
                            >
                              <Ionicons name="arrow-back" size={12} color={colors.brand.brown} />
                            </TouchableOpacity>
                          )}
                          {currentIndex < STATUSES.length - 1 && (
                            <TouchableOpacity
                              style={styles.moveButton}
                              onPress={() => move(task, STATUSES[currentIndex + 1])}
                              disabled={movingId === task.id}
                              accessibilityLabel={`Move "${task.title}" forward to ${STATUSES[currentIndex + 1]}`}
                            >
                              <Ionicons name="arrow-forward" size={12} color={colors.brand.brown} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
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
    maxWidth: 960,
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
  formCard: {
    gap: spacing.xs,
  },
  board: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  column: {
    flex: 1,
    minWidth: 220,
    gap: spacing.sm,
  },
  columnTitle: {
    fontSize: typography.label.fontSize,
    fontWeight: "700",
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  columnBody: {
    gap: spacing.sm,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 4,
    gap: 4,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  taskTitle: {
    flex: 1,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  taskDescription: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.secondary,
  },
  taskMeta: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
  },
  moveRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  moveButton: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
