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
    red: "#f38ba8", // error text
    shadow: "rgba(0,0,0,0.5)"
  },
  light: {
    base: "#eff1f5", // main background
    surface0: "#e6e9ef", // toolbar background
    surface1: "#dce0e8", // button background
    overlay0: "#9ca0b0", // borders / strokes
    text: "#4c4f69", // primary text
    red: "#d20f39", // error text
    shadow: "rgba(0,0,0,0.15)"
  }
} as const;

// Mocha alias — used where theme context is unavailable (e.g. element creation)
export const colors = colorsByTheme.dark;

// Full Catppuccin Mocha palette for xterm.js ITheme
export const terminalTheme = {
  background: "#1e1e2e",
  foreground: "#cdd6f4",
  cursor: "#f5c2e7",
  cursorAccent: "#1e1e2e",
  selectionBackground: "#58517266",
  black: "#45475a",
  red: "#f38ba8",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  blue: "#89b4fa",
  magenta: "#f5c2e7",
  cyan: "#94e2d5",
  white: "#bac2de",
  brightBlack: "#585b70",
  brightRed: "#f38ba8",
  brightGreen: "#a6e3a1",
  brightYellow: "#f9e2af",
  brightBlue: "#89b4fa",
  brightMagenta: "#f5c2e7",
  brightCyan: "#94e2d5",
  brightWhite: "#a6adc8"
} as const;
