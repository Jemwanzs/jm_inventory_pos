import React from "react";

import { SettingsScreenShell } from "../../components/SettingsScreenShell";
import { TextField } from "../../components/TextField";
import { useSettingsCategory } from "../../hooks/useSettingsCategory";

interface TemplateSettings {
  invoice_terms: string;
  quotation_terms: string;
  purchase_order_terms: string;
  email_signature: string;
}

const DEFAULTS: TemplateSettings = {
  invoice_terms: "Payment due within 30 days.",
  quotation_terms: "Valid for 14 days from date of issue.",
  purchase_order_terms: "",
  email_signature: "",
};

const multilineStyle = { minHeight: 80, textAlignVertical: "top" as const };

export default function TemplatesScreen() {
  const { values, setField, isLoading, isSaving, error, saved, save } = useSettingsCategory(
    "templates",
    DEFAULTS
  );

  return (
    <SettingsScreenShell
      title="Templates"
      description="Standard text blocks used on generated documents and emails."
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      saved={saved}
      onSave={save}
    >
      <TextField
        label="Invoice terms"
        value={values.invoice_terms}
        onChangeText={(text) => setField("invoice_terms", text)}
        multiline
        numberOfLines={3}
        style={multilineStyle}
      />
      <TextField
        label="Quotation terms"
        value={values.quotation_terms}
        onChangeText={(text) => setField("quotation_terms", text)}
        multiline
        numberOfLines={3}
        style={multilineStyle}
      />
      <TextField
        label="Purchase order terms"
        value={values.purchase_order_terms}
        onChangeText={(text) => setField("purchase_order_terms", text)}
        multiline
        numberOfLines={3}
        style={multilineStyle}
      />
      <TextField
        label="Email signature"
        value={values.email_signature}
        onChangeText={(text) => setField("email_signature", text)}
        multiline
        numberOfLines={3}
        style={multilineStyle}
        placeholder="Thanks,&#10;The JMS Kenya team"
      />
    </SettingsScreenShell>
  );
}
