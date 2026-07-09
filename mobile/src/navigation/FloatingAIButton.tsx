import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";

import { colors, radii, spacing, typography } from "../theme";

// A persistent quick-access chat bubble, not a navigation target — opening
// it shows an inline preview panel without leaving whatever screen the user
// is on. The full experience lives at AI.Chat / AI.Insights / AI.ReportBuilder
// under the AI Assistant module in the sidebar.
export function FloatingAIButton() {
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const panelWidth = Math.min(300, width - spacing.lg * 2);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {open && (
        <View style={[styles.panel, { width: panelWidth }]}>
          <View style={styles.panelHeader}>
            <Ionicons name="sparkles-outline" size={16} color={colors.brand.brown} />
            <Text style={styles.panelTitle}>AI Assistant</Text>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-outline" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.panelBody}>
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.text.muted} />
            <Text style={styles.panelBodyText}>
              Ask about sales, stock, or approvals once the assistant is connected to your data.
            </Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask a question…"
              placeholderTextColor={colors.text.muted}
              editable={false}
            />
            <View style={styles.sendButton}>
              <Ionicons name="send-outline" size={15} color={colors.text.muted} />
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setOpen((prev) => !prev)} activeOpacity={0.85}>
        <Ionicons name={open ? "close-outline" : "chatbubble-ellipses-outline"} size={24} color={colors.text.inverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.brand.darkBrown,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 10px 24px rgba(42, 24, 16, 0.28)" },
      default: {
        shadowColor: colors.brand.darkerBrown,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...Platform.select({
      web: { boxShadow: "0 16px 32px rgba(42, 24, 16, 0.18)" },
      default: {
        shadowColor: colors.brand.darkerBrown,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  panelTitle: {
    flex: 1,
    fontSize: typography.subheading.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  panelBody: {
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  panelBodyText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    fontSize: typography.caption.fontSize,
    backgroundColor: colors.surfaceAlt,
    color: colors.text.muted,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
});
