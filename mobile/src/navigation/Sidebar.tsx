import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { BrandMark } from "../components/BrandMark";
import { colors, radii, spacing, typography } from "../theme";
import { defaultScreenFor, findModule, findScreen, MODULE_TREE } from "./screenTree";

const COLLAPSE_PREFERENCE_KEY = "inventory_pos.sidebar_collapsed";
const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

interface SidebarProps {
  activeRoute: string;
  onNavigate: (routeName: string) => void;
}

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(() => findScreen(activeRoute)?.module.key ?? "Dashboard");
  const [expandedBundle, setExpandedBundle] = useState<string | null>(() => findScreen(activeRoute)?.bundle.key ?? null);

  useEffect(() => {
    AsyncStorage.getItem(COLLAPSE_PREFERENCE_KEY).then((value) => {
      if (value === "true") setCollapsed(true);
    });
  }, []);

  // Only one module's submenu — and within it, only one bundle — expands
  // at a time (docs/ui-ux.md Desktop Layout), kept in sync with whatever
  // screen navigation lands on.
  useEffect(() => {
    const found = findScreen(activeRoute);
    if (found) {
      setExpandedModule(found.module.key);
      setExpandedBundle(found.bundle.key);
    }
  }, [activeRoute]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    AsyncStorage.setItem(COLLAPSE_PREFERENCE_KEY, String(next));
  };

  const handleModulePress = (moduleKey: string) => {
    if (collapsed) {
      setCollapsed(false);
      AsyncStorage.setItem(COLLAPSE_PREFERENCE_KEY, "false");
    }
    const isReopening = expandedModule !== moduleKey;
    setExpandedModule((prev) => (prev === moduleKey ? null : moduleKey));
    if (isReopening) {
      const module = findModule(moduleKey);
      setExpandedBundle(module?.bundles[0]?.key ?? null);
    }
    const target = defaultScreenFor(moduleKey);
    if (target) onNavigate(target.key);
  };

  const handleBundlePress = (bundleKey: string) => {
    setExpandedBundle((prev) => (prev === bundleKey ? null : bundleKey));
  };

  return (
    <View style={[styles.container, { width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }]}>
      <View style={styles.header}>
        <BrandMark size={32} />
        {!collapsed && <Text style={styles.brandLabel}>JMS Kenya</Text>}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {MODULE_TREE.map((module) => {
          const isModuleExpanded = expandedModule === module.key && !collapsed;
          const isActiveModule = findScreen(activeRoute)?.module.key === module.key;
          const hasBundles = module.bundles.length > 1;

          return (
            <View key={module.key}>
              <TouchableOpacity
                style={[styles.item, isActiveModule && styles.itemActive]}
                onPress={() => handleModulePress(module.key)}
              >
                <Ionicons
                  name={module.icon}
                  size={20}
                  color={isActiveModule ? colors.sidebar.activeText : colors.sidebar.text}
                />
                {!collapsed && (
                  <>
                    <Text
                      style={[styles.itemLabel, isActiveModule && styles.itemLabelActive]}
                      numberOfLines={1}
                    >
                      {module.label}
                    </Text>
                    <Ionicons
                      name={isModuleExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
                      size={14}
                      color={colors.sidebar.textMuted}
                    />
                  </>
                )}
              </TouchableOpacity>

              {isModuleExpanded &&
                (hasBundles
                  ? module.bundles.map((b) => {
                      const isBundleExpanded = expandedBundle === b.key;
                      const isActiveBundle = findScreen(activeRoute)?.bundle.key === b.key;
                      return (
                        <View key={b.key}>
                          <TouchableOpacity
                            style={[styles.bundleRow, isActiveBundle && styles.bundleRowActive]}
                            onPress={() => handleBundlePress(b.key)}
                          >
                            <Text
                              style={[styles.bundleLabel, isActiveBundle && styles.bundleLabelActive]}
                              numberOfLines={1}
                            >
                              {b.label}
                            </Text>
                            <Ionicons
                              name={isBundleExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
                              size={12}
                              color={colors.sidebar.textMuted}
                            />
                          </TouchableOpacity>
                          {isBundleExpanded &&
                            b.screens.map((item) => (
                              <TouchableOpacity
                                key={item.key}
                                style={[styles.subItem, activeRoute === item.key && styles.subItemActive]}
                                onPress={() => onNavigate(item.key)}
                              >
                                <Text
                                  style={[
                                    styles.subItemLabel,
                                    activeRoute === item.key && styles.subItemLabelActive,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                        </View>
                      );
                    })
                  : module.bundles[0].screens.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.subItem, activeRoute === item.key && styles.subItemActive]}
                        onPress={() => onNavigate(item.key)}
                      >
                        <Text
                          style={[styles.subItemLabel, activeRoute === item.key && styles.subItemLabelActive]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )))}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.item} onPress={toggleCollapsed}>
          <Ionicons
            name={collapsed ? "chevron-forward-outline" : "chevron-back-outline"}
            size={20}
            color={colors.sidebar.text}
          />
          {!collapsed && <Text style={styles.itemLabel}>Collapse</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.sidebar.text} />
          {!collapsed && <Text style={styles.itemLabel}>Sign out</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.sidebar.background,
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  brandLabel: {
    color: colors.sidebar.text,
    fontWeight: "700",
    fontSize: typography.subheading.fontSize,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    gap: 2,
  },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.sidebar.activeBackground,
    gap: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.sm,
  },
  itemActive: {
    backgroundColor: colors.sidebar.activeBackground,
  },
  itemLabel: {
    color: colors.sidebar.text,
    fontSize: typography.body.fontSize - 1,
    flexShrink: 1,
    flexGrow: 1,
  },
  itemLabelActive: {
    color: colors.sidebar.activeText,
    fontWeight: "600",
  },
  bundleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xl + spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: radii.sm,
  },
  bundleRowActive: {
    backgroundColor: "rgba(245, 201, 123, 0.08)",
  },
  bundleLabel: {
    color: colors.sidebar.textMuted,
    fontSize: typography.label.fontSize - 1,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bundleLabelActive: {
    color: colors.sidebar.activeText,
  },
  subItem: {
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xl + spacing.md,
    paddingRight: spacing.sm,
    borderRadius: radii.sm,
  },
  subItemActive: {
    backgroundColor: colors.sidebar.activeBackground,
  },
  subItemLabel: {
    color: colors.sidebar.textMuted,
    fontSize: typography.caption.fontSize,
  },
  subItemLabelActive: {
    color: colors.sidebar.activeText,
    fontWeight: "600",
  },
});
