import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { EmptyState } from "../components/EmptyState";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, spacing, typography } from "../theme";

export type { PlaceholderParams } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, string>;

export default function PlaceholderScreen({ route }: Props) {
  const { label, icon, description, tabs } = route.params!;

  return (
    <View style={styles.container}>
      <EmptyState icon={icon} title={`${label} is coming soon`} description={description} />
      {tabs && tabs.length > 0 && (
        <View style={styles.tabsNote}>
          <Text style={styles.tabsNoteLabel}>Planned tabs on this page:</Text>
          <View style={styles.tabsRow}>
            {tabs.map((tab) => (
              <View key={tab} style={styles.tabChip}>
                <Text style={styles.tabChipText}>{tab}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsNote: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  tabsNoteLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  tabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
  },
  tabChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
  tabChipText: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.secondary,
  },
});
