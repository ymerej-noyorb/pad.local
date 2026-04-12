import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";

function editorUrlFilePath(): string {
  return join(app.getPath("userData"), "editor-url.txt");
}

export function loadEditorUrl(): string | null {
  const filePath = editorUrlFilePath();
  if (existsSync(filePath)) return readFileSync(filePath, "utf-8").trim() || null;
  return null;
}

export function saveEditorUrl(url: string): Promise<void> {
  return writeFile(editorUrlFilePath(), url, "utf-8");
}
