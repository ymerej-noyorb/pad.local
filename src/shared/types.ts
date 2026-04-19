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

export type AiProvider = "claude" | "chatgpt" | "gemini" | "copilot" | "perplexity" | "mistral";

export interface AiProviderInfo {
  id: AiProvider;
  label: string;
  url: string;
}
