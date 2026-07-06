import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ApiError, login } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { colors, radii, spacing, typography } from "../theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.form}>
        <View style={styles.brandMark}>
          <Text style={styles.brandInitial}>J</Text>
        </View>
        <Text style={styles.title}>Inventory + POS</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.text.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Sign In" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.darkBrown,
    justifyContent: "center",
  },
  form: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    marginBottom: spacing.sm + 4,
    color: colors.text.primary,
    backgroundColor: colors.surfaceAlt,
  },
  error: {
    color: colors.semantic.danger,
    marginBottom: spacing.sm + 4,
    fontSize: typography.caption.fontSize,
  },
});
