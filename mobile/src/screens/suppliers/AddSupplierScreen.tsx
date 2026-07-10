import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, createSupplier } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing, typography } from "../../theme";

export default function AddSupplierScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createSupplier(
        {
          name: name.trim(),
          contact_person: contactPerson.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          payment_terms: paymentTerms.trim() || undefined,
        },
        token
      );
      navigation.navigate("Suppliers.List" as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Add Supplier</Text>
      <Text style={styles.subheading}>Name, contact person, phone/email, address, payment terms.</Text>

      <Card style={styles.card}>
        <TextField label="Supplier name" placeholder="Acme Distributors" value={name} onChangeText={setName} />
        <TextField label="Contact person (optional)" placeholder="Jane Doe" value={contactPerson} onChangeText={setContactPerson} />
        <View style={styles.row}>
          <View style={styles.field}>
            <TextField label="Phone (optional)" placeholder="+254 7xx xxx xxx" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
          <View style={styles.field}>
            <TextField label="Email (optional)" placeholder="supplier@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>
        <TextField label="Address (optional)" placeholder="Industrial Area, Nairobi" value={address} onChangeText={setAddress} />
        <TextField label="Payment terms (optional)" placeholder="Net 30" value={paymentTerms} onChangeText={setPaymentTerms} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Save Supplier" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
      </Card>
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
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  heading: {
    fontSize: typography.title.fontSize,
    fontWeight: "700",
    color: colors.text.primary,
  },
  subheading: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
    marginTop: -spacing.sm,
  },
  card: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  field: {
    flex: 1,
  },
  error: {
    color: colors.semantic.danger,
    marginBottom: spacing.sm + 4,
    fontSize: typography.caption.fontSize,
  },
});
