import type { AiProviderInfo } from "./types";

export const AI_PROVIDERS = [
  { id: "claude", label: "Claude", url: "https://claude.ai" },
  { id: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com" },
  { id: "gemini", label: "Gemini", url: "https://gemini.google.com" },
  { id: "copilot", label: "Copilot", url: "https://copilot.microsoft.com" },
  { id: "perplexity", label: "Perplexity", url: "https://perplexity.ai" },
  { id: "mistral", label: "Mistral", url: "https://chat.mistral.ai" }
] as const satisfies AiProviderInfo[];
