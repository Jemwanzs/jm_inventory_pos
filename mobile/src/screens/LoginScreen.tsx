import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ApiError, login } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout, useIsWideAuthLayout } from "../components/AuthLayout";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { colors, radii, spacing, typography } from "../theme";

interface LoginScreenProps {
  onGoToSignUp: () => void;
}

export default function LoginScreen({ onGoToSignUp }: LoginScreenProps) {
  const { signIn } = useAuth();
  const isWide = useIsWideAuthLayout();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        {!isWide && <BrandMark size={56} style={styles.brandMark} />}
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue to Inventory + POS</Text>

        <TextField
          label="Email"
          placeholder="you@business.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextField
          label="Password"
          placeholder="••••••••"
          isPassword
          value={password}
          onChangeText={setPassword}
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

        <View style={styles.signUpRow}>
          <Text style={styles.footnote}>Have an invite code?</Text>
          <TouchableOpacity onPress={onGoToSignUp}>
            <Text style={styles.signUpLink}> Create your account</Text>
          </TouchableOpacity>
        </View>

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
    marginBottom: spacing.md,
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
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
    flexWrap: "wrap",
  },
  signUpLink: {
    color: colors.brand.brown,
    fontSize: typography.caption.fontSize - 1,
    fontWeight: "700",
  },
  footnote: {
    color: colors.text.muted,
    fontSize: typography.caption.fontSize - 1,
    textAlign: "center",
  },
});
