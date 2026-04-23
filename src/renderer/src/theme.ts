// Design tokens — Catppuccin Mocha (dark) / Latte (light): https://catppuccin.com/palette
export const colorsByTheme = {
  dark: {
    base: "#1e1e2e", // main background
    surface0: "#313244", // toolbar background
    surface1: "#45475a", // button background
    overlay0: "#6c7086", // borders / strokes
    text: "#cdd6f4", // primary text
    red: "#f38ba8", // error text
    blue: "#89b4fa", // accent
    shadow: "rgba(0,0,0,0.5)"
  },
  light: {
    base: "#eff1f5", // main background
    surface0: "#e6e9ef", // toolbar background
    surface1: "#dce0e8", // button background
    overlay0: "#9ca0b0", // borders / strokes
    text: "#4c4f69", // primary text
    red: "#d20f39", // error text
    blue: "#1e66f5", // accent
    shadow: "rgba(0,0,0,0.15)"
  }
} as const;

// Mocha alias — used where theme context is unavailable (e.g. element creation)
export const colors = colorsByTheme.dark;
