import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync, renameSync } from "fs";
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

  // Migration: rename legacy scene.json → scene-default.json on first launch
  const oldScenePath = join(app.getPath("userData"), "scene.json");
  const newScenePath = join(app.getPath("userData"), "scene-default.json");
  if (existsSync(oldScenePath) && !existsSync(newScenePath)) {
    renameSync(oldScenePath, newScenePath);
  }
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
  return state;
}

export async function switchWorkspace(id: string): Promise<WorkspacesState> {
  const exists = state.workspaces.find((workspace: Workspace) => workspace.id === id);
  if (!exists || id === state.activeId) return state;
  state.activeId = id;
  await persistWorkspaces();
  return state;
}
