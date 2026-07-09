import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { MODULE_TREE } from "../navigation/screenTree";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, spacing, typography } from "../theme";

export default function MoreMenuScreen({ navigation }: NativeStackScreenProps<RootStackParamList, string>) {
  const { signOut } = useAuth();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>More</Text>
      <Text style={styles.subheading}>Every module and screen in the platform.</Text>

      <View style={styles.list}>
        {MODULE_TREE.map((module) => {
          const isModuleExpanded = expandedModule === module.key;
          const hasBundles = module.bundles.length > 1;

          return (
            <View key={module.key}>
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  const opening = expandedModule !== module.key;
                  setExpandedModule((prev) => (prev === module.key ? null : module.key));
                  setExpandedBundle(opening ? module.bundles[0]?.key ?? null : null);
                }}
              >
                <View style={styles.itemIcon}>
                  <Ionicons name={module.icon} size={20} color={colors.brand.brown} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{module.label}</Text>
                  <Text style={styles.itemDescription}>{module.description}</Text>
                </View>
                <Ionicons
                  name={isModuleExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
                  size={18}
                  color={colors.text.muted}
                />
              </TouchableOpacity>

              {isModuleExpanded && (
                <View style={styles.subList}>
                  {hasBundles
                    ? module.bundles.map((b) => {
                        const isBundleExpanded = expandedBundle === b.key;
                        return (
                          <View key={b.key}>
                            <TouchableOpacity
                              style={styles.bundleRow}
                              onPress={() => setExpandedBundle((prev) => (prev === b.key ? null : b.key))}
                            >
                              <Text style={styles.bundleLabel}>{b.label}</Text>
                              <Ionicons
                                name={isBundleExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
                                size={14}
                                color={colors.text.muted}
                              />
                            </TouchableOpacity>
                            {isBundleExpanded &&
                              b.screens.map((item) => (
                                <TouchableOpacity
                                  key={item.key}
                                  style={styles.subItem}
                                  onPress={() => navigation.navigate(item.key)}
                                >
                                  <Text style={styles.subItemLabel}>{item.label}</Text>
                                  <Ionicons name="chevron-forward-outline" size={14} color={colors.text.muted} />
                                </TouchableOpacity>
                              ))}
                          </View>
                        );
                      })
                    : module.bundles[0].screens.map((item) => (
                        <TouchableOpacity
                          key={item.key}
                          style={styles.subItem}
                          onPress={() => navigation.navigate(item.key)}
                        >
                          <Text style={styles.subItemLabel}>{item.label}</Text>
                          <Ionicons name="chevron-forward-outline" size={14} color={colors.text.muted} />
                        </TouchableOpacity>
                      ))}
                </View>
              )}
            </View>
          );
        })}

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
  subheading: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
    marginTop: -spacing.sm,
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
  subList: {
    backgroundColor: colors.background,
    paddingVertical: spacing.xs,
  },
  bundleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xl + spacing.md,
    paddingRight: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bundleLabel: {
    color: colors.text.muted,
    fontSize: typography.label.fontSize - 1,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xl + spacing.xl,
    paddingRight: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subItemLabel: {
    fontSize: typography.body.fontSize - 1,
    color: colors.text.primary,
  },
});
