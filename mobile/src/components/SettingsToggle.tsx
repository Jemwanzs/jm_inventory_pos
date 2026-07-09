import React from "react";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";

interface SettingsToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

// React Native Web's Switch renders as a native <input type="checkbox">
// under the hood and ignores trackColor for the "on" fill on some
// browsers, falling back to the OS/browser accent color (shows up green
// in Chromium) — accentColor is the actual web-respected override.
const webAccentStyle = Platform.OS === "web" ? ({ accentColor: colors.brand.brown } as object) : undefined;

export function SettingsToggle({ label, description, value, onValueChange }: SettingsToggleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.brand.brown }}
        thumbColor={colors.surface}
        style={webAccentStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  description: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
