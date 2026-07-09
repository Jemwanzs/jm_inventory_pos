import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AcceptInviteResponse, ApiError, acceptInvite, getInvite } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout, useIsWideAuthLayout } from "../components/AuthLayout";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { colors, radii, spacing, typography } from "../theme";

interface SignUpScreenProps {
  initialToken?: string;
  onBackToLogin: () => void;
}

type Step = "checking" | "enter-code" | "form" | "invalid";

export default function SignUpScreen({ initialToken, onBackToLogin }: SignUpScreenProps) {
  const { signIn } = useAuth();
  const isWide = useIsWideAuthLayout();

  const [step, setStep] = useState<Step>(initialToken ? "checking" : "enter-code");
  const [inviteToken, setInviteToken] = useState(initialToken ?? "");
  const [email, setEmail] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateCode = async (tokenToCheck: string) => {
    setCodeError(null);
    setStep("checking");
    try {
      const info = await getInvite(tokenToCheck.trim());
      setEmail(info.email);
      setInviteToken(tokenToCheck.trim());
      setStep("form");
    } catch (err) {
      setCodeError(err instanceof ApiError ? err.message : "Unable to reach the server");
      setStep(initialToken ? "invalid" : "enter-code");
    }
  };

  useEffect(() => {
    if (initialToken) validateCode(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  const canSubmitForm =
    name.trim().length > 0 && password.length >= 8 && password === confirmPassword && !isSubmitting;

  const handleCreateAccount = async () => {
    setFormError(null);
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const result: AcceptInviteResponse = await acceptInvite(inviteToken, name.trim(), password);
      await signIn(result.token, result.must_change_password);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <View style={styles.form}>
        {!isWide && <BrandMark size={56} style={styles.brandMark} />}

        {step === "checking" && (
          <View style={styles.centeredState}>
            <ActivityIndicator color={colors.brand.brown} />
            <Text style={styles.subtitle}>Checking your invite…</Text>
          </View>
        )}

        {step === "invalid" && (
          <View style={styles.centeredState}>
            <Text style={styles.title}>Invite not valid</Text>
            <Text style={styles.subtitle}>{codeError}</Text>
            <Button label="Enter a different code" onPress={() => setStep("enter-code")} style={styles.retryButton} />
          </View>
        )}

        {step === "enter-code" && (
          <>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Enter the invite code from your email to get started.</Text>

            <TextField
              label="Invite code"
              placeholder="Paste your invite code"
              autoCapitalize="none"
              value={inviteToken}
              onChangeText={setInviteToken}
            />

            {codeError ? <Text style={styles.error}>{codeError}</Text> : null}

            <Button
              label="Continue"
              onPress={() => validateCode(inviteToken)}
              disabled={inviteToken.trim().length === 0}
            />
          </>
        )}

        {step === "form" && (
          <>
            <Text style={styles.title}>Set up your account</Text>
            <Text style={styles.subtitle}>{email}</Text>

            <TextField label="Full name" placeholder="Jane Doe" value={name} onChangeText={setName} />
            <TextField
              label="Password"
              placeholder="At least 8 characters"
              isPassword
              value={password}
              onChangeText={setPassword}
            />
            <TextField
              label="Confirm password"
              placeholder="Re-enter your password"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <Button
              label="Create Account"
              onPress={handleCreateAccount}
              disabled={!canSubmitForm}
              loading={isSubmitting}
            />
          </>
        )}

        <TouchableOpacity style={styles.backLink} onPress={onBackToLogin}>
          <Text style={styles.backLinkText}>Back to sign in</Text>
        </TouchableOpacity>
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
  centeredState: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.md,
    alignSelf: "stretch",
  },
  error: {
    color: colors.semantic.danger,
    marginBottom: spacing.sm + 4,
    fontSize: typography.caption.fontSize,
  },
  backLink: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  backLinkText: {
    color: colors.text.muted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
});
