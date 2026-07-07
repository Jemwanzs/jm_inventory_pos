import React from "react";
import { Image, StyleProp, View, ViewStyle } from "react-native";

import { colors, radii } from "../theme";

interface BrandMarkProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// The JSM monogram (M crown, J hook on the right leg, S ribbon woven
// through the middle) rendered on the brand-brown badge used throughout
// the auth screens and sidebar. Single source so the mark stays
// consistent everywhere instead of a plain "J" per call site.
export function BrandMark({ size = 56, style }: BrandMarkProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radii.md,
          backgroundColor: colors.brand.brown,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Image
        source={require("../../assets/android-icon-foreground.png")}
        style={{ width: size * 0.72, height: size * 0.72 }}
        resizeMode="contain"
      />
    </View>
  );
}
