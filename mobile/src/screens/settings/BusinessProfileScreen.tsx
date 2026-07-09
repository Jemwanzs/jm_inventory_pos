import React from "react";

import { ChipSelect } from "../../components/ChipSelect";
import { SettingsScreenShell } from "../../components/SettingsScreenShell";
import { TextField } from "../../components/TextField";
import { useSettingsCategory } from "../../hooks/useSettingsCategory";

interface BusinessProfile {
  name: string;
  currency: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  receipt_footer: string;
  invoice_notes: string;
}

const DEFAULTS: BusinessProfile = {
  name: "",
  currency: "KES",
  contact_email: "",
  contact_phone: "",
  address: "",
  receipt_footer: "",
  invoice_notes: "",
};

const CURRENCIES = [
  { value: "KES", label: "KES" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "UGX", label: "UGX" },
];

export default function BusinessProfileScreen() {
  const { values, setField, isLoading, isSaving, error, saved, save } = useSettingsCategory(
    "business",
    DEFAULTS
  );

  return (
    <SettingsScreenShell
      title="Business Profile"
      description="Name, currency, and contact details used across receipts and invoices."
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      saved={saved}
      onSave={save}
    >
      <TextField
        label="Business name"
        value={values.name}
        onChangeText={(text) => setField("name", text)}
        placeholder="JMS Kenya"
      />
      <ChipSelect
        label="Currency"
        options={CURRENCIES}
        value={values.currency}
        onChange={(v) => setField("currency", v)}
      />
      <TextField
        label="Contact email"
        value={values.contact_email}
        onChangeText={(text) => setField("contact_email", text)}
        placeholder="hello@business.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField
        label="Contact phone"
        value={values.contact_phone}
        onChangeText={(text) => setField("contact_phone", text)}
        placeholder="+254 700 000000"
        keyboardType="phone-pad"
      />
      <TextField
        label="Address"
        value={values.address}
        onChangeText={(text) => setField("address", text)}
        placeholder="Street, city, country"
      />
      <TextField
        label="Receipt footer"
        value={values.receipt_footer}
        onChangeText={(text) => setField("receipt_footer", text)}
        placeholder="Thank you for your business!"
      />
      <TextField
        label="Invoice notes"
        value={values.invoice_notes}
        onChangeText={(text) => setField("invoice_notes", text)}
        placeholder="Payment due within 30 days."
      />
    </SettingsScreenShell>
  );
}
