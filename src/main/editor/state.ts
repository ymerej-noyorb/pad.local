import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import type { EditorType } from "../../shared/types";
import { getActiveWorkspaceId } from "../workspaces";

const EDITOR_TYPES: EditorType[] = ["vscode", "cursor", "windsurf", "vscodium"];
const DEFAULT_WORKSPACE_ID = "default";

function editorUrlFilePath(): string {
  return join(app.getPath("userData"), "editor-urls.json");
}

function loadAll(): Record<string, string> {
  const filePath = editorUrlFilePath();
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

function migrateUrls(urls: Record<string, string>): Record<string, string> {
  const migrated = { ...urls };
  for (const type of EDITOR_TYPES) {
    if (type in migrated && !migrated[`${DEFAULT_WORKSPACE_ID}:${type}`]) {
      migrated[`${DEFAULT_WORKSPACE_ID}:${type}`] = migrated[type];
      delete migrated[type];
    }
  }
  return migrated;
}

// Loaded once at module init — avoids re-reading the file on every URL lookup.
const urlCache: Record<string, string> = migrateUrls(loadAll());

export function loadEditorUrl(type: EditorType): string | null {
  return urlCache[`${getActiveWorkspaceId()}:${type}`] ?? null;
}

export async function saveEditorUrl(type: EditorType, url: string): Promise<void> {
  urlCache[`${getActiveWorkspaceId()}:${type}`] = url;
  await writeFile(editorUrlFilePath(), JSON.stringify(urlCache), "utf-8");
}
