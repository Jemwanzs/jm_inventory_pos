import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, radii, spacing, typography } from "../theme";

interface ChipSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function ChipSelect({ label, options, value, onChange }: ChipSelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
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
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: colors.brand.brown,
    borderColor: colors.brand.brown,
  },
  chipLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  chipLabelActive: {
    color: colors.text.inverse,
  },
});
