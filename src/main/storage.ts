import { app, shell } from "electron";
import { join } from "path";
import { readdirSync, statSync, readFileSync, unlinkSync } from "fs";
import { getWorkspacesState } from "./workspaces";
import type { DataFile } from "../shared/types";

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
