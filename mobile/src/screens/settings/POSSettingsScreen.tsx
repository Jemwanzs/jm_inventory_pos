import React from "react";
import { View } from "react-native";

import { SettingsScreenShell } from "../../components/SettingsScreenShell";
import { SettingsToggle } from "../../components/SettingsToggle";
import { TextField } from "../../components/TextField";
import { useSettingsCategory } from "../../hooks/useSettingsCategory";

interface POSSettings {
  allow_discount: boolean;
  max_discount_percentage: string;
  require_manager_pin_for_discount: boolean;
  enable_credit_sales: boolean;
  enable_shift_closure: boolean;
}

const DEFAULTS: POSSettings = {
  allow_discount: true,
  max_discount_percentage: "10",
  require_manager_pin_for_discount: false,
  enable_credit_sales: false,
  enable_shift_closure: true,
};

export default function POSSettingsScreen() {
  const { values, setField, isLoading, isSaving, error, saved, save } = useSettingsCategory("pos", DEFAULTS);

  return (
    <SettingsScreenShell
      title="POS Settings"
      description="Discounts, credit sales, and shift-closure rules used at checkout."
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      saved={saved}
      onSave={save}
    >
      <View>
        <SettingsToggle
          label="Allow discounts"
          value={values.allow_discount}
          onValueChange={(v) => setField("allow_discount", v)}
        />
        <SettingsToggle
          label="Require manager PIN for discounts"
          value={values.require_manager_pin_for_discount}
          onValueChange={(v) => setField("require_manager_pin_for_discount", v)}
        />
        <SettingsToggle
          label="Enable credit sales"
          description="Let cashiers sell on credit against a customer's account."
          value={values.enable_credit_sales}
          onValueChange={(v) => setField("enable_credit_sales", v)}
        />
        <SettingsToggle
          label="Enable shift closure"
          description="Require cashiers to open/close a cash session per shift."
          value={values.enable_shift_closure}
          onValueChange={(v) => setField("enable_shift_closure", v)}
        />
      </View>

      <TextField
        label="Maximum discount (%)"
        value={values.max_discount_percentage}
        onChangeText={(text) => setField("max_discount_percentage", text.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder="10"
      />
    </SettingsScreenShell>
  );
}
