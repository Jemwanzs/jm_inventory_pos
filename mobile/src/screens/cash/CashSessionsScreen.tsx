import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ApiError,
  CashSession,
  Workspace,
  closeShift,
  getUserIdFromToken,
  listCashSessions,
  listWorkspaces,
  openShift,
  recordCashMovement,
} from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, spacing, typography } from "../../theme";

export default function CashSessionsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const userId = token ? getUserIdFromToken(token) : null;
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [workspaceId, setWorkspaceId] = useState("");
  const [openingFloat, setOpeningFloat] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [isRecording, setIsRecording] = useState<"In" | "Out" | null>(null);

  const [actualCash, setActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [s, w] = await Promise.all([listCashSessions(token), listWorkspaces(token)]);
      setSessions(s);
      setWorkspaces(w.filter((x) => x.is_active));
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

  const myOpenSession = sessions.find((s) => s.status === "Open" && s.cashier_id === userId);

  const handleOpen = async () => {
    if (!token) return;
    setError(null);
    setIsOpening(true);
    try {
      await openShift(workspaceId, openingFloat || "0", token);
      setWorkspaceId("");
      setOpeningFloat("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsOpening(false);
    }
  };

  const handleMovement = async (type: "In" | "Out") => {
    if (!token || !myOpenSession) return;
    setError(null);
    setIsRecording(type);
    try {
      await recordCashMovement(myOpenSession.id, type, movementAmount, movementReason.trim() || undefined, token);
      setMovementAmount("");
      setMovementReason("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsRecording(null);
    }
  };

  const handleClose = async () => {
    if (!token || !myOpenSession) return;
    setError(null);
    setIsClosing(true);
    try {
      await closeShift(myOpenSession.id, actualCash || "0", closeNotes.trim() || undefined, token);
      setActualCash("");
      setCloseNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Cash Sessions</Text>
      <Text style={styles.subheading}>{sessions.length} total</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : myOpenSession ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Your open shift — {myOpenSession.workspace_name}</Text>
          <Text style={styles.cardMeta}>
            Opening float KES {myOpenSession.opening_float} · Cash in KES {myOpenSession.cash_in} · Cash out KES{" "}
            {myOpenSession.cash_out}
          </Text>

          <View style={styles.row}>
            <View style={styles.field}>
              <TextField
                label="Amount"
                placeholder="0.00"
                value={movementAmount}
                onChangeText={(t) => setMovementAmount(t.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.field}>
              <TextField label="Reason (optional)" placeholder="Petty cash, etc." value={movementReason} onChangeText={setMovementReason} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Button label="Cash In" variant="secondary" onPress={() => handleMovement("In")} loading={isRecording === "In"} disabled={!movementAmount} />
            </View>
            <View style={styles.field}>
              <Button label="Cash Out" variant="ghost" onPress={() => handleMovement("Out")} loading={isRecording === "Out"} disabled={!movementAmount} />
            </View>
          </View>

          <Text style={[styles.cardTitle, styles.closeTitle]}>Close shift</Text>
          <TextField
            label="Actual cash counted"
            placeholder="0.00"
            value={actualCash}
            onChangeText={(t) => setActualCash(t.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
          />
          <TextField label="Notes (optional)" placeholder="Handover notes" value={closeNotes} onChangeText={setCloseNotes} />
          <Button label="Close Shift" onPress={handleClose} loading={isClosing} disabled={!actualCash} />
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Open a new shift</Text>
          {workspaces.length === 0 ? (
            <Text style={styles.hint}>You need at least one workspace (Settings &gt; Workspaces) first.</Text>
          ) : (
            <>
              <ChipSelect
                label="Workspace"
                options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
                value={workspaceId}
                onChange={setWorkspaceId}
              />
              <TextField
                label="Opening float"
                placeholder="0.00"
                value={openingFloat}
                onChangeText={(t) => setOpeningFloat(t.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
              />
              <Button label="Open Shift" onPress={handleOpen} loading={isOpening} disabled={!workspaceId} />
            </>
          )}
        </Card>
      )}

      <View style={styles.list}>
        {sessions.map((s) => (
          <View key={s.id} style={styles.sessionRow}>
            <View style={styles.rowIcon}>
              <Ionicons name="cash-outline" size={18} color={colors.brand.brown} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{s.workspace_name}</Text>
              <Text style={styles.rowMeta}>
                {s.cashier_email} · Opened {new Date(s.opened_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
            <View style={styles.statusWrap}>
              <Text style={[styles.statusTag, s.status === "Closed" && styles.statusClosed]}>{s.status}</Text>
              {s.status === "Closed" && s.variance !== null && (
                <Text style={styles.variance}>
                  Variance KES {s.variance}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
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
  card: {
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.subheading.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  closeTitle: {
    marginTop: spacing.sm,
  },
  cardMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  field: {
    flex: 1,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sessionRow: {
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
  statusWrap: {
    alignItems: "flex-end",
  },
  statusTag: {
    fontSize: typography.caption.fontSize - 1,
    fontWeight: "700",
    color: colors.semantic.warning,
  },
  statusClosed: {
    color: colors.semantic.success,
  },
  variance: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
    marginTop: 1,
  },
});
