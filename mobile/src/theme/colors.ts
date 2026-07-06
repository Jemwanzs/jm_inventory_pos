// Brand palette: brown / warm-cream / dark-brown, warmed accents throughout
// (including semantic colors) so nothing feels bolted on from a generic kit.
export const colors = {
  brand: {
    brown: "#6F4E37",
    brownLight: "#8A6A4F",
    darkBrown: "#3B2415",
    darkerBrown: "#2A1810",
    cream: "#FAF3E7",
    creamDark: "#F0E6D6",
    gold: "#C9973F",
  },

  background: "#FAF3E7",
  surface: "#FFFDF8",
  surfaceAlt: "#F0E6D6",
  border: "#E0D3BE",

  text: {
    primary: "#2A1810",
    secondary: "#7A6350",
    inverse: "#FAF3E7",
    muted: "#A6957F",
  },

  sidebar: {
    background: "#2E1D12",
    text: "#E9DCC9",
    textMuted: "#B49A7D",
    activeBackground: "#4A3222",
    activeText: "#F5C97B",
  },

  semantic: {
    success: "#4B7F52",
    successBg: "#E7F0E4",
    warning: "#C97B2E",
    warningBg: "#FBEEDD",
    danger: "#B23A2E",
    dangerBg: "#F8E6E3",
    info: "#4A6FA5",
    infoBg: "#E7EDF5",
  },
} as const;
