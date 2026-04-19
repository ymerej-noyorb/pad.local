import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import type { EditorType } from "../../shared/types";

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

export function loadEditorUrl(type: EditorType): string | null {
  return loadAll()[type] ?? null;
}

export async function saveEditorUrl(type: EditorType, url: string): Promise<void> {
  const all = loadAll();
  all[type] = url;
  await writeFile(editorUrlFilePath(), JSON.stringify(all), "utf-8");
}
