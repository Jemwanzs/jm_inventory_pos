import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { MORE_MODULES } from "../navigation/modules";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, spacing, typography } from "../theme";

export default function MoreMenuScreen({ navigation }: NativeStackScreenProps<RootStackParamList, string>) {
  const { signOut } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>More</Text>

      <View style={styles.list}>
        {MORE_MODULES.map((module) => (
          <TouchableOpacity
            key={module.key}
            style={styles.item}
            onPress={() => navigation.navigate(module.key)}
          >
            <View style={styles.itemIcon}>
              <Ionicons name={module.icon} size={20} color={colors.brand.brown} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemLabel}>{module.label}</Text>
              <Text style={styles.itemDescription}>{module.description}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.item} onPress={signOut}>
          <View style={styles.itemIcon}>
            <Ionicons name="log-out-outline" size={20} color={colors.semantic.danger} />
          </View>
          <View style={styles.itemText}>
            <Text style={[styles.itemLabel, { color: colors.semantic.danger }]}>Sign out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  heading: {
    fontSize: typography.title.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.brand.creamDark,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  itemDescription: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 1,
  },
});
