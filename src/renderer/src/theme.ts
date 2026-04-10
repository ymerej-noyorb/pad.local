/**
 * Design tokens — Catppuccin palette
 * https://catppuccin.com/palette
 * dark → Mocha, light → Latte
 */
export const colorsByTheme = {
  dark: {
    base: "#1e1e2e", // main background
    surface0: "#313244", // toolbar background
    surface1: "#45475a", // button background
    overlay0: "#6c7086", // borders / strokes
    text: "#cdd6f4", // primary text
    shadow: "rgba(0,0,0,0.5)"
  },
  light: {
    base: "#eff1f5", // main background
    surface0: "#e6e9ef", // toolbar background
    surface1: "#dce0e8", // button background
    overlay0: "#9ca0b0", // borders / strokes
    text: "#4c4f69", // primary text
    shadow: "rgba(0,0,0,0.15)"
  }
} as const;

// Mocha alias — used where theme context is unavailable (e.g. element creation)
export const colors = colorsByTheme.dark;
