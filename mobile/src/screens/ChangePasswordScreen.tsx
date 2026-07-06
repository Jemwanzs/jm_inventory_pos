import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ApiError, changePassword } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { colors, radii, spacing, typography } from "../theme";

export default function ChangePasswordScreen() {
  const { token, completePasswordChange, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const { token: newToken } = await changePassword(currentPassword, newPassword, token);
      await completePasswordChange(newToken);
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
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.subtitle}>
          This is a first-time login. Choose a new password to continue.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Current (temporary) password"
          placeholderTextColor={colors.text.muted}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="New password (min. 8 characters)"
          placeholderTextColor={colors.text.muted}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor={colors.text.muted}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Update Password"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={isSubmitting}
        />

        <TouchableOpacity style={styles.linkButton} onPress={signOut}>
          <Text style={styles.linkText}>Sign out</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: typography.heading.fontSize + 4,
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
  linkButton: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  linkText: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
  },
});
