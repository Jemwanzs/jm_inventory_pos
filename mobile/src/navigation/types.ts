import type { Ionicons } from "@expo/vector-icons";

export interface PlaceholderParams {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  tabs?: string[];
}

// Loosely typed on purpose: each placeholder module screen shares the same
// param shape today. Tighten this to a per-route mapped type once modules
// grow real, distinct params (e.g. a product id for a detail screen).
export type RootStackParamList = Record<string, PlaceholderParams | undefined>;
