import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";

function cwdsFilePath(): string {
  return join(app.getPath("userData"), "terminal-cwds.json");
}

export function loadTerminalCwds(): Record<string, string> {
  const filePath = cwdsFilePath();
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

export function saveTerminalCwds(cwds: Record<string, string>): Promise<void> {
  return writeFile(cwdsFilePath(), JSON.stringify(cwds), "utf-8");
}
