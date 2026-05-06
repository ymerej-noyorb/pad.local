// Design tokens — Catppuccin Mocha (dark) / Latte (light): https://catppuccin.com/palette
export const colorsByTheme = {
  dark: {
    base: "#1e1e2e", // main background
    surface0: "#313244", // toolbar background
    surface1: "#45475a", // button background
    overlay0: "#6c7086", // borders / strokes
    text: "#cdd6f4", // primary text
    subtext: "#a6adc8", // muted text
    red: "#f38ba8", // error text
    blue: "#89b4fa", // accent / JSON keys
    green: "#a6e3a1", // JSON string values
    peach: "#fab387", // JSON numbers
    mauve: "#cba6f7", // JSON booleans / null
    shadow: "rgba(0,0,0,0.5)"
  },
  light: {
    base: "#eff1f5", // main background
    surface0: "#e6e9ef", // toolbar background
    surface1: "#dce0e8", // button background
    overlay0: "#9ca0b0", // borders / strokes
    text: "#4c4f69", // primary text
    subtext: "#6c6f85", // muted text
    red: "#d20f39", // error text
    blue: "#1e66f5", // accent / JSON keys
    green: "#40a02b", // JSON string values
    peach: "#fe640b", // JSON numbers
    mauve: "#8839ef", // JSON booleans / null
    shadow: "rgba(0,0,0,0.15)"
  }
} as const;

// Mocha alias — used where theme context is unavailable (e.g. element creation)
export const colors = colorsByTheme.dark;
