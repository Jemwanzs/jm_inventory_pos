import React from "react";
import { View } from "react-native";

import { ChipSelect } from "../../components/ChipSelect";
import { SettingsScreenShell } from "../../components/SettingsScreenShell";
import { SettingsToggle } from "../../components/SettingsToggle";
import { TextField } from "../../components/TextField";
import { useSettingsCategory } from "../../hooks/useSettingsCategory";

interface InventorySettings {
  allow_negative_stock: boolean;
  require_approval_for_adjustment: boolean;
  default_valuation_method: string;
  enable_batch_tracking: boolean;
  enable_expiry_tracking: boolean;
  low_stock_threshold: string;
}

const DEFAULTS: InventorySettings = {
  allow_negative_stock: false,
  require_approval_for_adjustment: true,
  default_valuation_method: "weighted_average",
  enable_batch_tracking: false,
  enable_expiry_tracking: false,
  low_stock_threshold: "10",
};

const VALUATION_METHODS = [
  { value: "fifo", label: "FIFO" },
  { value: "weighted_average", label: "Weighted Average" },
  { value: "last_purchase", label: "Last Purchase Cost" },
];

export default function InventorySettingsScreen() {
  const { values, setField, isLoading, isSaving, error, saved, save } = useSettingsCategory(
    "inventory",
    DEFAULTS
  );

  return (
    <SettingsScreenShell
      title="Inventory Settings"
      description="Stock rules, tracking, and valuation method used across the Inventory module."
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      saved={saved}
      onSave={save}
    >
      <View>
        <SettingsToggle
          label="Allow negative stock"
          description="Let a sale go through even if it would take stock below zero."
          value={values.allow_negative_stock}
          onValueChange={(v) => setField("allow_negative_stock", v)}
        />
        <SettingsToggle
          label="Require approval for adjustments"
          description="Stock adjustments need sign-off before they apply."
          value={values.require_approval_for_adjustment}
          onValueChange={(v) => setField("require_approval_for_adjustment", v)}
        />
        <SettingsToggle
          label="Batch tracking"
          description="Track stock by batch/lot number."
          value={values.enable_batch_tracking}
          onValueChange={(v) => setField("enable_batch_tracking", v)}
        />
        <SettingsToggle
          label="Expiry tracking"
          description="Track and alert on product expiry dates."
          value={values.enable_expiry_tracking}
          onValueChange={(v) => setField("enable_expiry_tracking", v)}
        />
      </View>

      <ChipSelect
        label="Default valuation method"
        options={VALUATION_METHODS}
        value={values.default_valuation_method}
        onChange={(v) => setField("default_valuation_method", v)}
      />

      <TextField
        label="Low stock threshold"
        value={values.low_stock_threshold}
        onChangeText={(text) => setField("low_stock_threshold", text.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder="10"
      />
    </SettingsScreenShell>
  );
}
