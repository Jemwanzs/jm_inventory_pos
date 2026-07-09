import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, NumberingSequence, listNumbering, updateNumbering } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { SettingsToggle } from "../../components/SettingsToggle";
import { TextField } from "../../components/TextField";
import { colors, spacing, typography } from "../../theme";

const DOCUMENT_LABELS: Record<string, string> = {
  product: "Products",
  invoice: "Invoices",
  receipt: "Receipts",
  purchase_order: "Purchase Orders",
  quotation: "Quotations",
};

function buildPreview(seq: NumberingSequence): string {
  const parts = [seq.prefix];
  if (seq.include_year) parts.push("2026");
  if (seq.include_month) parts.push("07");
  parts.push("1".padStart(seq.sequence_length, "0"));
  return parts.filter(Boolean).join(seq.separator || "-");
}

function NumberingRow({
  sequence,
  onSave,
}: {
  sequence: NumberingSequence;
  onSave: (documentType: string, patch: Omit<NumberingSequence, "document_type" | "next_number">) => Promise<void>;
}) {
  const [prefix, setPrefix] = useState(sequence.prefix);
  const [includeYear, setIncludeYear] = useState(sequence.include_year);
  const [includeMonth, setIncludeMonth] = useState(sequence.include_month);
  const [sequenceLength, setSequenceLength] = useState(String(sequence.sequence_length));
  const [separator, setSeparator] = useState(sequence.separator);
  const [isSaving, setIsSaving] = useState(false);

  const preview = buildPreview({
    document_type: sequence.document_type,
    prefix,
    include_year: includeYear,
    include_month: includeMonth,
    sequence_length: Number(sequenceLength) || 1,
    separator,
    next_number: sequence.next_number,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(sequence.document_type, {
        prefix,
        include_year: includeYear,
        include_month: includeMonth,
        sequence_length: Number(sequenceLength) || 1,
        separator,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>{DOCUMENT_LABELS[sequence.document_type] ?? sequence.document_type}</Text>
      <Text style={styles.preview}>{preview}</Text>

      <View style={styles.row}>
        <View style={styles.rowField}>
          <TextField label="Prefix" value={prefix} onChangeText={setPrefix} placeholder="INV" />
        </View>
        <View style={styles.rowField}>
          <TextField label="Separator" value={separator} onChangeText={setSeparator} placeholder="-" />
        </View>
        <View style={styles.rowField}>
          <TextField
            label="Digits"
            value={sequenceLength}
            onChangeText={(text) => setSequenceLength(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="4"
          />
        </View>
      </View>

      <SettingsToggle label="Include year" value={includeYear} onValueChange={setIncludeYear} />
      <SettingsToggle label="Include month" value={includeMonth} onValueChange={setIncludeMonth} />

      <Button label="Save" onPress={handleSave} loading={isSaving} style={styles.saveButton} />
    </Card>
  );
}

export default function NumberingSettingsScreen() {
  const { token } = useAuth();
  const [sequences, setSequences] = useState<NumberingSequence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setSequences(await listNumbering(token));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to reach the server");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const handleSave = async (
    documentType: string,
    patch: Omit<NumberingSequence, "document_type" | "next_number">
  ) => {
    if (!token) return;
    setError(null);
    try {
      const updated = await updateNumbering(documentType, patch, token);
      setSequences((prev) => prev.map((s) => (s.document_type === documentType ? updated : s)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.brand.brown} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Numbering Settings</Text>
      <Text style={styles.subheading}>How products, invoices, receipts, and other documents get numbered.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {sequences.map((sequence) => (
        <NumberingRow key={sequence.document_type} sequence={sequence} onSave={handleSave} />
      ))}
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
    gap: spacing.md,
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
    marginBottom: spacing.sm,
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
  preview: {
    fontSize: typography.body.fontSize,
    color: colors.brand.brown,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowField: {
    flex: 1,
  },
  saveButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
});
