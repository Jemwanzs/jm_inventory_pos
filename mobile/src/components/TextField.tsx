import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";

import { colors, radii, spacing, typography } from "../theme";

interface TextFieldProps extends TextInputProps {
  label: string;
  isPassword?: boolean;
}

export function TextField({ label, isPassword, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            isPassword && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={isPassword && !isVisible}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsVisible((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isVisible ? "eye-off-outline" : "eye-outline"}
              size={19}
              color={colors.text.muted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.label.fontSize,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.surfaceAlt,
  },
  inputWithIcon: {
    paddingRight: spacing.xl + spacing.sm,
  },
  inputFocused: {
    borderColor: colors.brand.brown,
    backgroundColor: colors.surface,
  },
  eyeButton: {
    position: "absolute",
    right: spacing.md,
  },
});
