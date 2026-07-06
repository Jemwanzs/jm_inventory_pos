import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { colors, radii, spacing, typography } from "../theme";
import { MODULES } from "./modules";

const COLLAPSE_PREFERENCE_KEY = "inventory_pos.sidebar_collapsed";
const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

interface SidebarProps {
  activeRoute: string;
  onNavigate: (routeName: string) => void;
}

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(COLLAPSE_PREFERENCE_KEY).then((value) => {
      if (value === "true") setCollapsed(true);
    });
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    AsyncStorage.setItem(COLLAPSE_PREFERENCE_KEY, String(next));
  };

  return (
    <View style={[styles.container, { width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }]}>
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Text style={styles.brandInitial}>J</Text>
        </View>
        {!collapsed && <Text style={styles.brandLabel}>JMS Kenya</Text>}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {MODULES.map((module) => {
          const isActive = module.key === activeRoute;
          return (
            <TouchableOpacity
              key={module.key}
              style={[styles.item, isActive && styles.itemActive]}
              onPress={() => onNavigate(module.key)}
            >
              <Ionicons
                name={module.icon}
                size={20}
                color={isActive ? colors.sidebar.activeText : colors.sidebar.text}
              />
              {!collapsed && (
                <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]} numberOfLines={1}>
                  {module.label}
                </Text>
              )}
            </TouchableOpacity>
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
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.brand.brown,
    alignItems: "center",
    justifyContent: "center",
  },
  brandInitial: {
    color: colors.text.inverse,
    fontWeight: "700",
    fontSize: 16,
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
  },
  itemLabelActive: {
    color: colors.sidebar.activeText,
    fontWeight: "600",
  },
});
