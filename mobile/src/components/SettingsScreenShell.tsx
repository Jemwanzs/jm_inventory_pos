import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";
import { Button } from "./Button";
import { Card } from "./Card";

interface SettingsScreenShellProps {
  title: string;
  description: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saved: boolean;
  onSave: () => void;
  saveLabel?: string;
  children: React.ReactNode;
}

export function SettingsScreenShell({
  title,
  description,
  isLoading,
  isSaving,
  error,
  saved,
  onSave,
  saveLabel = "Save Changes",
  children,
}: SettingsScreenShellProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.brand.brown} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subheading}>{description}</Text>

      <Card style={styles.card}>{children}</Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={saved ? "Saved!" : saveLabel}
        onPress={onSave}
        loading={isSaving}
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
  card: {
    gap: spacing.xs,
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
