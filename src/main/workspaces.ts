import { app } from "electron";
import { join } from "path";
import { existsSync, readdirSync, readFileSync, renameSync, rmSync } from "fs";
import { writeFile } from "fs/promises";
import type { Workspace, WorkspacesState } from "../shared/types";

const DEFAULT_WORKSPACE_ID = "default";

const DEFAULT_STATE: WorkspacesState = {
  workspaces: [{ id: DEFAULT_WORKSPACE_ID, name: "Default" }],
  activeId: DEFAULT_WORKSPACE_ID
};

function workspacesFilePath(): string {
  return join(app.getPath("userData"), "workspaces.json");
}

let state: WorkspacesState = structuredClone(DEFAULT_STATE);

function persistWorkspaces(): Promise<void> {
  return writeFile(workspacesFilePath(), JSON.stringify(state, null, 2), "utf-8");
}

export function loadWorkspaces(): void {
  const filePath = workspacesFilePath();
  if (existsSync(filePath)) {
    try {
      state = JSON.parse(readFileSync(filePath, "utf-8")) as WorkspacesState;
    } catch {
      state = structuredClone(DEFAULT_STATE);
    }
  } else {
    state = structuredClone(DEFAULT_STATE);
  }

  const userDataPath = app.getPath("userData");

  // Migration: rename legacy scene.json → scene-default.json on first launch
  const oldScenePath = join(userDataPath, "scene.json");
  const newScenePath = join(userDataPath, "scene-default.json");
  if (existsSync(oldScenePath) && !existsSync(newScenePath)) {
    renameSync(oldScenePath, newScenePath);
  }

  // Cleanup: remove scene files for workspaces that no longer exist
  const knownIds = new Set(state.workspaces.map((workspace) => workspace.id));
  readdirSync(userDataPath)
    .filter((name) => name.startsWith("scene-") && name.endsWith(".json"))
    .forEach((name) => {
      const id = name.slice("scene-".length, -".json".length);
      if (!knownIds.has(id)) rmSync(join(userDataPath, name));
    });
}

export function getActiveWorkspaceId(): string {
  return state.activeId;
}

export function getWorkspacesState(): WorkspacesState {
  return state;
}

export async function createWorkspace(name: string): Promise<WorkspacesState> {
  const id = crypto.randomUUID();
  state.workspaces.push({ id, name });
  state.activeId = id;
  await persistWorkspaces();
  return state;
}

export async function renameWorkspace(id: string, name: string): Promise<WorkspacesState> {
  const workspace = state.workspaces.find((workspace: Workspace) => workspace.id === id);
  if (workspace) {
    workspace.name = name;
    await persistWorkspaces();
  }
  return state;
}

export async function deleteWorkspace(id: string): Promise<WorkspacesState> {
  if (state.workspaces.length <= 1) return state;
  const isActive = id === state.activeId;
  state.workspaces = state.workspaces.filter((workspace: Workspace) => workspace.id !== id);
  if (isActive) {
    state.activeId = state.workspaces[0].id;
  }
  await persistWorkspaces();
  const scenePath = join(app.getPath("userData"), `scene-${id}.json`);
  if (existsSync(scenePath)) rmSync(scenePath);
  return state;
}

export async function switchWorkspace(id: string): Promise<WorkspacesState> {
  const exists = state.workspaces.find((workspace: Workspace) => workspace.id === id);
  if (!exists || id === state.activeId) return state;
  state.activeId = id;
  await persistWorkspaces();
  return state;
}
