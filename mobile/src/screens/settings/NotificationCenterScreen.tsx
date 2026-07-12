import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ApiError, Notification, listNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { colors, radii, spacing, typography } from "../../theme";

export default function NotificationCenterScreen() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      setNotifications(await listNotifications(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRead = async (id: string) => {
    if (!token) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(id, token);
    } catch {
      // best-effort; a failed mark-as-read isn't worth surfacing an error for
    }
  };

  const handleReadAll = async () => {
    if (!token) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead(token);
    } catch {
      // best-effort
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Notification Center</Text>
          <Text style={styles.subheading}>{unreadCount} unread</Text>
        </View>
        {unreadCount > 0 && <Button label="Mark all read" variant="ghost" onPress={handleReadAll} />}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.brand.brown} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          description="Approval requests assigned to you, and decisions on requests you submitted, show up here."
        />
      ) : (
        <View style={styles.list}>
          {notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.row, !n.is_read && styles.rowUnread]}
              onPress={() => !n.is_read && handleRead(n.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, n.is_read && styles.dotRead]} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{n.title}</Text>
                {n.body ? <Text style={styles.rowBody}>{n.body}</Text> : null}
                <Text style={styles.rowTime}>
                  {new Date(n.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              {!n.is_read && <Ionicons name="ellipse" size={8} color={colors.semantic.warning} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
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
    gap: spacing.lg,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontSize: typography.title.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  subheading: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  error: {
    color: colors.semantic.danger,
    fontSize: typography.caption.fontSize,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowUnread: {
    backgroundColor: colors.brand.creamDark,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.warning,
    marginTop: 6,
  },
  dotRead: {
    backgroundColor: "transparent",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text.primary,
  },
  rowBody: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 1,
  },
  rowTime: {
    fontSize: typography.caption.fontSize - 1,
    color: colors.text.muted,
    marginTop: 2,
  },
});
