import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ApiError, login } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout, useIsWideAuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { colors, radii, spacing, typography } from "../theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const isWide = useIsWideAuthLayout();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForgotNote, setShowForgotNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { token, must_change_password } = await login(email.trim(), password);
      await signIn(token, must_change_password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <View style={styles.form}>
        {!isWide && (
          <View style={styles.brandMark}>
            <Text style={styles.brandInitial}>J</Text>
          </View>
        )}
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue to Inventory + POS</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, focusedField === "email" && styles.inputFocused]}
          placeholder="you@business.com"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, focusedField === "password" && styles.inputFocused]}
          placeholder="••••••••"
          placeholderTextColor={colors.text.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedField("password")}
          onBlur={() => setFocusedField(null)}
        />

        <TouchableOpacity style={styles.forgotLink} onPress={() => setShowForgotNote((prev) => !prev)}>
          <Text style={styles.forgotLinkText}>Forgot password?</Text>
        </TouchableOpacity>

        {showForgotNote && (
          <View style={styles.forgotNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.semantic.info} />
            <Text style={styles.forgotNoteText}>
              Self-service reset isn't set up yet — ask your tenant admin to reset your password for
              now.
            </Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Sign In" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />

        <Text style={styles.footnote}>
          Accounts are created by your business administrator — there's no public sign-up.
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...Platform.select({
      web: { boxShadow: "0 20px 40px rgba(42, 24, 16, 0.12)" },
      default: {
        shadowColor: colors.brand.darkerBrown,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 6,
      },
    }),
  },
  brandMark: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.brand.brown,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  brandInitial: {
    color: colors.text.inverse,
    fontSize: 24,
    fontWeight: "700",
  },
  title: {
    fontSize: typography.title.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.label.fontSize,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    marginBottom: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.surfaceAlt,
  },
  inputFocused: {
    borderColor: colors.brand.brown,
    backgroundColor: colors.surface,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  forgotLinkText: {
    color: colors.brand.brown,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  forgotNote: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: colors.semantic.infoBg,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  forgotNoteText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  error: {
    color: colors.semantic.danger,
    marginBottom: spacing.sm + 4,
    fontSize: typography.caption.fontSize,
  },
  footnote: {
    marginTop: spacing.lg,
    color: colors.text.muted,
    fontSize: typography.caption.fontSize - 1,
    textAlign: "center",
  },
});
