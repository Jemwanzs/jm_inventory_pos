import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  ApiError,
  ApprovalWorkflow,
  BasicUser,
  createWorkflow,
  deleteWorkflow,
  listUsers,
  listWorkflows,
  updateWorkflowActive,
} from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { EmptyState } from "../../components/EmptyState";
import { TextField } from "../../components/TextField";
import { colors, radii, spacing, typography } from "../../theme";

const TRIGGER_TYPES = [
  { value: "purchase_order_create", label: "Large Purchase Order" },
  { value: "cash_expense", label: "Cash-Out / Expense Payment" },
];

function triggerLabel(value: string): string {
  return TRIGGER_TYPES.find((t) => t.value === value)?.label ?? value;
}

interface DraftStep {
  approverUserId: string;
}

export default function ApprovalWorkflowsScreen() {
  const { token } = useAuth();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [users, setUsers] = useState<BasicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("purchase_order_create");
  const [threshold, setThreshold] = useState("");
  const [steps, setSteps] = useState<DraftStep[]>([{ approverUserId: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [w, u] = await Promise.all([listWorkflows(token), listUsers(token)]);
      setWorkflows(w);
      setUsers(u);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStep = (index: number, approverUserId: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { approverUserId } : s)));
  };
  const addStep = () => setSteps((prev) => [...prev, { approverUserId: "" }]);
  const removeStep = (index: number) => setSteps((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setName("");
    setTriggerType("purchase_order_create");
    setThreshold("");
    setSteps([{ approverUserId: "" }]);
  };

  const canSubmit = name.trim().length > 0 && steps.every((s) => s.approverUserId) && !isSubmitting;

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createWorkflow(
        {
          name: name.trim(),
          trigger_type: triggerType,
          threshold: threshold || undefined,
          steps: steps.map((s) => ({ approver_user_id: s.approverUserId })),
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

  const handleToggleActive = async (workflow: ApprovalWorkflow) => {
    if (!token) return;
    setBusyId(workflow.id);
    try {
      await updateWorkflowActive(workflow.id, !workflow.is_active, token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setBusyId(id);
    try {
      await deleteWorkflow(id, token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Approval Workflows</Text>
          <Text style={styles.subheading}>{workflows.length} configured</Text>
        </View>
        {users.length > 0 && <Button label={showForm ? "Cancel" : "New Workflow"} onPress={() => setShowForm((v) => !v)} />}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isLoading && users.length === 0 && (
        <Card>
          <Text style={styles.hint}>You need at least one other user (Settings &gt; Users) to assign as an approver.</Text>
        </Card>
      )}

      {showForm && (
        <Card style={styles.formCard}>
          <TextField label="Workflow name" placeholder="Large purchases need finance sign-off" value={name} onChangeText={setName} />
          <ChipSelect label="Applies to" options={TRIGGER_TYPES} value={triggerType} onChange={setTriggerType} />
          <TextField
            label="Threshold amount (optional — leave blank to require approval every time)"
            placeholder="100000"
            value={threshold}
            onChangeText={(t) => setThreshold(t.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
          />

          <Text style={styles.linesLabel}>Approval steps, in order</Text>
          {steps.map((step, index) => (
            <View key={index} style={styles.lineCard}>
              <View style={styles.lineHeader}>
                <Text style={styles.lineIndex}>Step {index + 1}</Text>
                {steps.length > 1 && (
                  <TouchableOpacity onPress={() => removeStep(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.semantic.danger} />
                  </TouchableOpacity>
                )}
              </View>
              <ChipSelect
                label="Approver"
                options={users.map((u) => ({ value: u.id, label: u.full_name || u.email }))}
                value={step.approverUserId}
                onChange={(v) => updateStep(index, v)}
              />
            </View>
          ))}
          <Button label="Add another step" variant="ghost" onPress={addStep} />

          <Button label="Save Workflow" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
        </Card>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : workflows.length === 0 ? (
        <EmptyState
          icon="git-branch-outline"
          title="No workflows configured"
          description="Without a workflow, purchase orders and cash-outs go through with no approval gate."
        />
      ) : (
        <View style={styles.list}>
          {workflows.map((w) => (
            <View key={w.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{w.name}</Text>
                <Text style={styles.rowMeta}>
                  {triggerLabel(w.trigger_type)}
                  {w.threshold ? ` · over KES ${w.threshold}` : " · always"} · {w.steps.length} step
                  {w.steps.length === 1 ? "" : "s"} ({w.steps.map((s) => s.approver_name).join(" → ")})
                </Text>
              </View>
              <View style={styles.actions}>
                <Button
                  label={w.is_active ? "Active" : "Inactive"}
                  variant={w.is_active ? "secondary" : "ghost"}
                  onPress={() => handleToggleActive(w)}
                  loading={busyId === w.id}
                />
                <TouchableOpacity onPress={() => handleDelete(w.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.semantic.danger} />
                </TouchableOpacity>
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
