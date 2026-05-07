export type EditorType = "vscode" | "cursor" | "windsurf" | "vscodium";

export interface EditorInfo {
  type: EditorType;
  label: string;
  binary: string;
  version?: string;
}

export interface ShellInfo {
  path: string;
  label: string;
}

export type AiProvider = "claude" | "chatgpt" | "gemini" | "copilot" | "perplexity" | "mistral";

export interface AiProviderInfo {
  id: AiProvider;
  label: string;
  url: string;
}

export interface Workspace {
  id: string;
  name: string;
}

export interface WorkspacesState {
  workspaces: Workspace[];
  activeId: string;
}

export interface DataFile {
  name: string;
  sizeBytes: number;
  lastModified: number;
  description: string;
  isCritical: boolean;
}
