import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, createCustomer } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing, typography } from "../../theme";

export default function AddCustomerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, string>) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [group, setGroup] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createCustomer(
        {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          customer_group: group.trim() || undefined,
          credit_limit: creditLimit || undefined,
        },
        token
      );
      navigation.navigate("Customers.List" as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Add Customer</Text>
      <Text style={styles.subheading}>Name, phone/email, address, group, credit limit.</Text>

      <Card style={styles.card}>
        <TextField label="Customer name" placeholder="Mary Wanjiru" value={name} onChangeText={setName} />
        <View style={styles.row}>
          <View style={styles.field}>
            <TextField label="Phone (optional)" placeholder="+254 7xx xxx xxx" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
          <View style={styles.field}>
            <TextField label="Email (optional)" placeholder="customer@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>
        <TextField label="Address (optional)" placeholder="Kilimani, Nairobi" value={address} onChangeText={setAddress} />
        <View style={styles.row}>
          <View style={styles.field}>
            <TextField label="Customer group (optional)" placeholder="Retail / Wholesale" value={group} onChangeText={setGroup} />
          </View>
          <View style={styles.field}>
            <TextField
              label="Credit limit (optional)"
              placeholder="0.00"
              value={creditLimit}
              onChangeText={(t) => setCreditLimit(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Save Customer" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
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
