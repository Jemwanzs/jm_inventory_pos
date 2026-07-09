import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SettingsScreenShell } from "../../components/SettingsScreenShell";
import { SettingsToggle } from "../../components/SettingsToggle";
import { TextField } from "../../components/TextField";
import { useSettingsCategory } from "../../hooks/useSettingsCategory";
import { colors, radii, spacing, typography } from "../../theme";

interface SecuritySettings {
  session_timeout_minutes: string;
  password_min_length: string;
  require_mfa: boolean;
}

const DEFAULTS: SecuritySettings = {
  session_timeout_minutes: "60",
  password_min_length: "8",
  require_mfa: false,
};

export default function SecuritySettingsScreen() {
  const { values, setField, isLoading, isSaving, error, saved, save } = useSettingsCategory(
    "security",
    DEFAULTS
  );

  return (
    <SettingsScreenShell
      title="Security Settings"
      description="Password rules and session behavior."
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      saved={saved}
      onSave={save}
    >
      <TextField
        label="Session timeout (minutes)"
        value={values.session_timeout_minutes}
        onChangeText={(text) => setField("session_timeout_minutes", text.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder="60"
      />
      <TextField
        label="Minimum password length"
        value={values.password_min_length}
        onChangeText={(text) => setField("password_min_length", text.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder="8"
      />

      <SettingsToggle
        label="Require multi-factor authentication"
        description="Saved as a preference, but not enforced at login yet — see the note below."
        value={values.require_mfa}
        onValueChange={(v) => setField("require_mfa", v)}
      />

      {values.require_mfa && (
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.semantic.info} />
          <Text style={styles.noteText}>
            MFA enforcement isn't wired into login yet. This preference is saved for when it is.
          </Text>
        </View>
      )}
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: colors.semantic.infoBg,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
  },
  noteText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
});
