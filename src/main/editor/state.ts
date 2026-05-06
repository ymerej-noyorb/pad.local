import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import type { EditorType } from "../../shared/types";
import { getActiveWorkspaceId } from "../workspaces";

function editorUrlFilePath(): string {
  return join(app.getPath("userData"), "editor-urls.json");
}

function loadAll(): Record<string, string> {
  const filePath = editorUrlFilePath();
  if (!existsSync(filePath)) return {};
  try {
    const raw: Record<string, string> = JSON.parse(readFileSync(filePath, "utf-8"));
    // Migration: legacy keys had no workspace prefix (e.g. "vscode") → "default:vscode"
    const migrated: Record<string, string> = {};
    let needsWrite = false;
    for (const [key, value] of Object.entries(raw)) {
      if (!key.includes(":")) {
        migrated[`default:${key}`] = value;
        needsWrite = true;
      } else {
        migrated[key] = value;
      }
    }
    if (needsWrite) {
      writeFile(editorUrlFilePath(), JSON.stringify(migrated), "utf-8").catch(() => undefined);
    }
    return migrated;
  } catch {
    return {};
  }
}

// Loaded once at module init — avoids re-reading the file on every URL lookup.
const urlCache: Record<string, string> = loadAll();

function urlKey(type: EditorType): string {
  return `${getActiveWorkspaceId()}:${type}`;
}

export function loadEditorUrl(type: EditorType): string | null {
  return urlCache[urlKey(type)] ?? null;
}

export async function saveEditorUrl(type: EditorType, url: string): Promise<void> {
  urlCache[urlKey(type)] = url;
  await writeFile(editorUrlFilePath(), JSON.stringify(urlCache), "utf-8");
}
