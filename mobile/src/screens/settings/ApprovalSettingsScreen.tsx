import React from "react";

import { SettingsScreenShell } from "../../components/SettingsScreenShell";
import { SettingsToggle } from "../../components/SettingsToggle";
import { TextField } from "../../components/TextField";
import { useSettingsCategory } from "../../hooks/useSettingsCategory";

interface ApprovalSettings {
  require_approval_stock_adjustment: boolean;
  require_approval_stock_transfer: boolean;
  require_approval_price_change: boolean;
  require_approval_discount_above: boolean;
  discount_approval_threshold: string;
  maker_checker_enabled: boolean;
}

const DEFAULTS: ApprovalSettings = {
  require_approval_stock_adjustment: true,
  require_approval_stock_transfer: false,
  require_approval_price_change: true,
  require_approval_discount_above: true,
  discount_approval_threshold: "10",
  maker_checker_enabled: true,
};

export default function ApprovalSettingsScreen() {
  const { values, setField, isLoading, isSaving, error, saved, save } = useSettingsCategory(
    "approval",
    DEFAULTS
  );

  return (
    <SettingsScreenShell
      title="Approval Settings"
      description="Which actions require sign-off before they take effect."
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      saved={saved}
      onSave={save}
    >
      <SettingsToggle
        label="Require approval for stock adjustments"
        value={values.require_approval_stock_adjustment}
        onValueChange={(v) => setField("require_approval_stock_adjustment", v)}
      />
      <SettingsToggle
        label="Require approval for stock transfers"
        value={values.require_approval_stock_transfer}
        onValueChange={(v) => setField("require_approval_stock_transfer", v)}
      />
      <SettingsToggle
        label="Require approval for price changes"
        value={values.require_approval_price_change}
        onValueChange={(v) => setField("require_approval_price_change", v)}
      />
      <SettingsToggle
        label="Require approval for large discounts"
        description="Discounts above the threshold below need sign-off."
        value={values.require_approval_discount_above}
        onValueChange={(v) => setField("require_approval_discount_above", v)}
      />
      {values.require_approval_discount_above && (
        <TextField
          label="Discount approval threshold (%)"
          value={values.discount_approval_threshold}
          onChangeText={(text) => setField("discount_approval_threshold", text.replace(/[^0-9.]/g, ""))}
          keyboardType="decimal-pad"
          placeholder="10"
        />
      )}
      <SettingsToggle
        label="Maker-checker enforcement"
        description="The person who creates a sensitive action can never approve it themselves."
        value={values.maker_checker_enabled}
        onValueChange={(v) => setField("maker_checker_enabled", v)}
      />
    </SettingsScreenShell>
  );
}
