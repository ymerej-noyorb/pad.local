import type { EditorType } from "../shared/types";

export const EDITOR_BASE_PORT = 8080;

export const EDITOR_PORTS: Record<EditorType, number> = {
  vscode: 8080,
  cursor: 8081,
  windsurf: 8082,
  vscodium: 8083
};
