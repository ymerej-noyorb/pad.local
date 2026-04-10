import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";

function sceneFilePath(): string {
  return join(app.getPath("userData"), "scene.json");
}

export function loadScene(): string | null {
  const filePath = sceneFilePath();
  if (existsSync(filePath)) return readFileSync(filePath, "utf-8");
  return null;
}

export function saveScene(json: string): Promise<void> {
  return writeFile(sceneFilePath(), json, "utf-8");
}
