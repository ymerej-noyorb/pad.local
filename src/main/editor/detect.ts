import { existsSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import type { EditorInfo, EditorType } from "../../shared/types";

interface EditorDefinition {
  type: EditorType;
  label: string;
  winCandidates: string[];
  winCommand: string;
  macCandidates: string[];
  unixFallbackCommand: string;
}

const EDITOR_DEFINITIONS: EditorDefinition[] = [
  {
    type: "vscode",
    label: "VS Code",
    winCandidates: [
      join(process.env.LOCALAPPDATA ?? "", "Programs", "Microsoft VS Code", "bin", "code.cmd")
    ],
    winCommand: "code.cmd",
    macCandidates: [
      "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
      "/usr/local/bin/code",
      "/opt/homebrew/bin/code"
    ],
    unixFallbackCommand: "code"
  },
  {
    type: "cursor",
    label: "Cursor",
    winCandidates: [
      join(
        process.env.LOCALAPPDATA ?? "",
        "Programs",
        "cursor",
        "resources",
        "app",
        "bin",
        "cursor.cmd"
      ),
      join(
        process.env.APPDATA ?? "",
        "Local",
        "Programs",
        "cursor",
        "resources",
        "app",
        "bin",
        "cursor.cmd"
      )
    ],
    winCommand: "cursor.cmd",
    macCandidates: [
      "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
      "/usr/local/bin/cursor"
    ],
    unixFallbackCommand: "cursor"
  },
  {
    type: "windsurf",
    label: "Windsurf",
    winCandidates: [
      join(process.env.LOCALAPPDATA ?? "", "Programs", "windsurf", "bin", "windsurf.cmd")
    ],
    winCommand: "windsurf.cmd",
    macCandidates: [
      "/Applications/Windsurf.app/Contents/Resources/app/bin/windsurf",
      "/usr/local/bin/windsurf"
    ],
    unixFallbackCommand: "windsurf"
  },
  {
    type: "vscodium",
    label: "VSCodium",
    winCandidates: [
      join(process.env.LOCALAPPDATA ?? "", "Programs", "VSCodium", "bin", "codium.cmd")
    ],
    winCommand: "codium.cmd",
    macCandidates: [
      "/Applications/VSCodium.app/Contents/Resources/app/bin/codium",
      "/usr/local/bin/codium",
      "/opt/homebrew/bin/codium"
    ],
    unixFallbackCommand: "codium"
  }
];

function findBinaryWindows(definition: EditorDefinition): string | null {
  for (const candidate of definition.winCandidates) {
    if (existsSync(candidate)) return candidate;
  }
  try {
    execSync(`where ${definition.winCommand}`, { stdio: "ignore" });
    return definition.winCommand;
  } catch {
    return null;
  }
}

function findBinaryMac(definition: EditorDefinition): string | null {
  for (const candidate of definition.macCandidates) {
    if (existsSync(candidate)) return candidate;
  }
  try {
    execSync(`which ${definition.unixFallbackCommand}`, { stdio: "ignore" });
    return definition.unixFallbackCommand;
  } catch {
    return null;
  }
}

function findBinaryLinux(definition: EditorDefinition): string | null {
  try {
    execSync(`which ${definition.unixFallbackCommand}`, { stdio: "ignore" });
    return definition.unixFallbackCommand;
  } catch {
    return null;
  }
}

function findBinary(definition: EditorDefinition): string | null {
  if (process.platform === "win32") return findBinaryWindows(definition);
  if (process.platform === "darwin") return findBinaryMac(definition);
  return findBinaryLinux(definition);
}

export function detectEditors(): EditorInfo[] {
  return EDITOR_DEFINITIONS.flatMap((definition) => {
    const binary = findBinary(definition);
    if (!binary) return [];
    return [{ type: definition.type, label: definition.label, binary }];
  });
}

export function getEditorBinary(type: EditorType): string | null {
  const definition = EDITOR_DEFINITIONS.find((d) => d.type === type);
  if (!definition) return null;
  return findBinary(definition);
}
