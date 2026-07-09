import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, createInvite } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { colors, radii, spacing, typography } from "../theme";

export default function InviteUserScreen() {
  const { token } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = email.trim().length > 0 && email.includes("@") && !isSubmitting;

  const handleInvite = async () => {
    if (!token) return;
    setError(null);
    setInviteLink(null);
    setIsSubmitting(true);
    try {
      const result = await createInvite(email.trim(), token);
      setInviteLink(result.invite_link);
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Invite a user</Text>
      <Text style={styles.subheading}>
        Send an invite by email. They'll set their own name and password to finish creating the
        account — see docs/architecture.md Business Setup Wizard for the full onboarding flow this
        will plug into.
      </Text>

      <Card style={styles.card}>
        <TextField
          label="Email address"
          placeholder="teammate@business.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Send Invite" onPress={handleInvite} disabled={!canSubmit} loading={isSubmitting} />
      </Card>

      {inviteLink && (
        <Card style={styles.linkCard}>
          <View style={styles.linkHeader}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.semantic.success} />
            <Text style={styles.linkHeaderText}>Invite created</Text>
          </View>
          <Text style={styles.linkHint}>
            Emailed if Resend is configured — here's the link either way, valid for 7 days:
          </Text>
          <Text style={styles.linkText} selectable>
            {inviteLink}
          </Text>
          <Button
            label={copied ? "Copied!" : "Copy Link"}
            variant="ghost"
            onPress={handleCopy}
            style={styles.copyButton}
          />
        </Card>
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
    maxWidth: 520,
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
    marginBottom: spacing.sm + 4,
    fontSize: typography.caption.fontSize,
  },
  linkCard: {
    backgroundColor: colors.semantic.successBg,
    borderColor: colors.semantic.success,
    gap: spacing.xs,
  },
  linkHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  linkHeaderText: {
    fontSize: typography.subheading.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  linkHint: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  linkText: {
    fontSize: typography.caption.fontSize,
    color: colors.brand.darkBrown,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontFamily: Platform.select({ web: "monospace", default: undefined }),
  },
  copyButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
  },
});
