import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "../components/EmptyState";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme";

export type { PlaceholderParams } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, string>;

export default function PlaceholderScreen({ route }: Props) {
  const { label, icon, description } = route.params!;

  return (
    <View style={styles.container}>
      <EmptyState icon={icon} title={`${label} is coming soon`} description={description} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
