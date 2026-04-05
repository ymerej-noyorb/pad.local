import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

function sceneFilePath(): string {
  return join(app.getPath("userData"), "scene.json");
}

export function loadScene(): string | null {
  const filePath = sceneFilePath();
  if (existsSync(filePath)) return readFileSync(filePath, "utf-8");
  return null;
}

export function saveScene(json: string): void {
  writeFileSync(sceneFilePath(), json, "utf-8");
}
