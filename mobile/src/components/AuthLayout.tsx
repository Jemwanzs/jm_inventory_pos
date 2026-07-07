import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { colors, radii, spacing, typography } from "../theme";
import { BrandMark } from "./BrandMark";

const BRAND_FEATURES = [
  { icon: "cube-outline" as const, label: "Track stock across every branch in real time" },
  { icon: "storefront-outline" as const, label: "Fast, reliable POS built for daily use" },
  { icon: "shield-checkmark-outline" as const, label: "Full audit trail on every transaction" },
];

export const AUTH_WIDE_BREAKPOINT = 900;

export function useIsWideAuthLayout(): boolean {
  const { width } = useWindowDimensions();
  return width >= AUTH_WIDE_BREAKPOINT;
}

interface AuthLayoutProps {
  children: React.ReactNode;
}

// Shared shell for every auth screen (login, accept-invite, etc.) so they
// all get the identical equal-halves split on wide screens instead of each
// screen reimplementing the brand panel.
export function AuthLayout({ children }: AuthLayoutProps) {
  const isWide = useIsWideAuthLayout();

  return (
    <View style={styles.container}>
      {isWide && (
        <LinearGradient
          colors={[colors.brand.darkBrown, colors.brand.brown]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandPanel}
        >
          <BrandMark size={64} style={styles.brandMarkLarge} />
          <Text style={styles.brandPanelTitle}>JMS Kenya</Text>
          <Text style={styles.brandPanelSubtitle}>Inventory, Stock, Sales & POS — built for every branch.</Text>

          <View style={styles.featureList}>
            {BRAND_FEATURES.map((feature) => (
              <View key={feature.label} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={feature.icon} size={18} color={colors.brand.cream} />
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      )}

      <KeyboardAvoidingView
        style={styles.contentPane}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.background,
  },
  // Equal halves on wide screens: both panes get flex: 1 with no
  // maxWidth on either side, so they split the container 50/50.
  brandPanel: {
    flex: 1,
    padding: spacing.xxl,
    justifyContent: "center",
  },
  contentPane: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  brandMarkLarge: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: "rgba(250, 243, 231, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(250, 243, 231, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  brandPanelTitle: {
    color: colors.brand.cream,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  brandPanelSubtitle: {
    color: colors.sidebar.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 22,
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  featureList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: "rgba(250, 243, 231, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    color: colors.brand.cream,
    fontSize: typography.caption.fontSize,
    flexShrink: 1,
  },
});
