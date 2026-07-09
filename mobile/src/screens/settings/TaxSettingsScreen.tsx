import React from "react";

import { ChipSelect } from "../../components/ChipSelect";
import { SettingsScreenShell } from "../../components/SettingsScreenShell";
import { SettingsToggle } from "../../components/SettingsToggle";
import { TextField } from "../../components/TextField";
import { useSettingsCategory } from "../../hooks/useSettingsCategory";

interface TaxSettings {
  tax_rate: string;
  tax_inclusive_pricing: boolean;
  tax_display: string;
}

const DEFAULTS: TaxSettings = {
  tax_rate: "16",
  tax_inclusive_pricing: true,
  tax_display: "inclusive",
};

const TAX_DISPLAY_OPTIONS = [
  { value: "inclusive", label: "Show as inclusive" },
  { value: "exclusive", label: "Show as exclusive" },
  { value: "both", label: "Show both" },
];

export default function TaxSettingsScreen() {
  const { values, setField, isLoading, isSaving, error, saved, save } = useSettingsCategory("tax", DEFAULTS);

  return (
    <SettingsScreenShell
      title="Tax Settings"
      description="Tax rate and how tax appears on receipts and invoices."
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      saved={saved}
      onSave={save}
    >
      <TextField
        label="Tax rate (%)"
        value={values.tax_rate}
        onChangeText={(text) => setField("tax_rate", text.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        placeholder="16"
      />

      <SettingsToggle
        label="Tax-inclusive pricing"
        description="Product prices already include tax."
        value={values.tax_inclusive_pricing}
        onValueChange={(v) => setField("tax_inclusive_pricing", v)}
      />

      <ChipSelect
        label="Tax display on receipts"
        options={TAX_DISPLAY_OPTIONS}
        value={values.tax_display}
        onChange={(v) => setField("tax_display", v)}
      />
    </SettingsScreenShell>
  );
}
