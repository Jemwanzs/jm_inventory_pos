import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

import { colors, radii, spacing, typography } from "../theme";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

export function Button({ label, variant = "primary", loading, disabled, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "ghost" ? colors.brand.brown : colors.text.inverse} />
      ) : (
        <Text style={[styles.label, variant === "ghost" && styles.ghostLabel]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    paddingVertical: spacing.md - 2,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.brand.darkBrown,
  },
  secondary: {
    backgroundColor: colors.brand.brown,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.text.inverse,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  ghostLabel: {
    color: colors.brand.brown,
  },
});
