import { app, shell } from "electron";
import { join } from "path";
import { readdirSync, statSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { getWorkspacesState } from "./workspaces";
import type { DataFile } from "../shared/types";

const BACKUP_VERSION = "1";

function getUserDataPath(): string {
  return app.getPath("userData");
}

function isValidFileName(name: string): boolean {
  return !name.includes("/") && !name.includes("\\") && !name.includes("..");
}

function describeFile(
  name: string,
  workspaceMap: Map<string, string>
): { description: string; isCritical: boolean } {
  if (name === "workspaces.json") {
    return { description: "Workspace list", isCritical: true };
  }
  if (name === "editor-urls.json") {
    return { description: "Last editor URLs", isCritical: false };
  }
  if (name === "terminal-cwds.json") {
    return { description: "Terminal working directories", isCritical: false };
  }
  if (name.startsWith("scene-") && name.endsWith(".json")) {
    const workspaceId = name.slice("scene-".length, -".json".length);
    const workspaceName = workspaceMap.get(workspaceId);
    const label = workspaceName ? `"${workspaceName}"` : workspaceId;
    return { description: `Canvas — workspace ${label}`, isCritical: true };
  }
  return { description: name, isCritical: false };
}

export function listDataFiles(): DataFile[] {
  const userDataPath = getUserDataPath();
  const { workspaces } = getWorkspacesState();
  const workspaceMap = new Map(workspaces.map((workspace) => [workspace.id, workspace.name]));

  let entries: string[];
  try {
    entries = readdirSync(userDataPath).filter((name) => name.endsWith(".json"));
  } catch {
    return [];
  }

  return entries.map((name) => {
    const filePath = join(userDataPath, name);
    const stat = statSync(filePath);
    return {
      name,
      sizeBytes: stat.size,
      lastModified: stat.mtimeMs,
      ...describeFile(name, workspaceMap)
    };
  });
}

export function readDataFile(name: string): string {
  if (!isValidFileName(name)) throw new Error("Invalid file name");
  return readFileSync(join(getUserDataPath(), name), "utf-8");
}

export function deleteDataFile(name: string): void {
  if (!isValidFileName(name)) throw new Error("Invalid file name");
  unlinkSync(join(getUserDataPath(), name));
}

export function openStorageFolder(): Promise<string> {
  return shell.openPath(getUserDataPath());
}

export function getStoragePath(): string {
  return getUserDataPath();
}

export function exportData(targetPath: string): void {
  const userDataPath = getUserDataPath();
  const names = readdirSync(userDataPath).filter((name) => name.endsWith(".json"));
  const files: Record<string, string> = {};
  for (const name of names) {
    files[name] = readFileSync(join(userDataPath, name), "utf-8");
  }
  const archive = JSON.stringify(
    { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), files },
    null,
    2
  );
  writeFileSync(targetPath, archive, "utf-8");
}

const SCENE_ID_PATTERN = /^(default|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

function isAllowedFileName(name: string): boolean {
  if (name === "workspaces.json") return true;
  if (name === "editor-urls.json") return true;
  if (name === "terminal-cwds.json") return true;
  if (name.startsWith("scene-") && name.endsWith(".json")) {
    const id = name.slice("scene-".length, -".json".length);
    return SCENE_ID_PATTERN.test(id);
  }
  return false;
}

export function importData(sourcePath: string): number {
  const userDataPath = getUserDataPath();
  const raw = readFileSync(sourcePath, "utf-8");
  const archive = JSON.parse(raw) as { version?: string; files?: unknown };
  if (!archive.files || typeof archive.files !== "object" || Array.isArray(archive.files)) {
    throw new Error("Invalid backup file: missing 'files' field");
  }
  let count = 0;
  for (const [name, content] of Object.entries(archive.files as Record<string, unknown>)) {
    if (!isAllowedFileName(name)) continue;
    if (typeof content !== "string") continue;
    JSON.parse(content); // throws if content is not valid JSON
    writeFileSync(join(userDataPath, name), content, "utf-8");
    count++;
  }
  return count;
}
