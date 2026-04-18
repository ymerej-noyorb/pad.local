export type EditorType = "vscode" | "cursor" | "windsurf" | "vscodium";

export interface EditorInfo {
  type: EditorType;
  label: string;
  binary: string;
}

export interface ShellInfo {
  path: string;
  label: string;
}
