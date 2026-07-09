import React from "react";
import { View } from "react-native";

import { SettingsScreenShell } from "../../components/SettingsScreenShell";
import { SettingsToggle } from "../../components/SettingsToggle";
import { useSettingsCategory } from "../../hooks/useSettingsCategory";

interface NotificationSettings {
  email_alerts: boolean;
  low_stock_alerts: boolean;
  approval_alerts: boolean;
  sales_alerts: boolean;
  cash_variance_alerts: boolean;
}

const DEFAULTS: NotificationSettings = {
  email_alerts: true,
  low_stock_alerts: true,
  approval_alerts: true,
  sales_alerts: false,
  cash_variance_alerts: true,
};

export default function NotificationSettingsScreen() {
  const { values, setField, isLoading, isSaving, error, saved, save } = useSettingsCategory(
    "notifications",
    DEFAULTS
  );

  return (
    <SettingsScreenShell
      title="Notification Settings"
      description="Which events send an email and appear in the in-app notification list."
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      saved={saved}
      onSave={save}
    >
      <View>
        <SettingsToggle
          label="Email alerts"
          description="Master switch for all email notifications."
          value={values.email_alerts}
          onValueChange={(v) => setField("email_alerts", v)}
        />
        <SettingsToggle
          label="Low stock alerts"
          value={values.low_stock_alerts}
          onValueChange={(v) => setField("low_stock_alerts", v)}
        />
        <SettingsToggle
          label="Approval alerts"
          description="Notify when something needs your approval."
          value={values.approval_alerts}
          onValueChange={(v) => setField("approval_alerts", v)}
        />
        <SettingsToggle
          label="Sales alerts"
          description="Notify on large or unusual sales."
          value={values.sales_alerts}
          onValueChange={(v) => setField("sales_alerts", v)}
        />
        <SettingsToggle
          label="Cash variance alerts"
          description="Notify when a shift closes with a cash shortage or excess."
          value={values.cash_variance_alerts}
          onValueChange={(v) => setField("cash_variance_alerts", v)}
        />
      </View>
    </SettingsScreenShell>
  );
}
