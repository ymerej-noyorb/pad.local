import { ipcMain } from "electron";
import { loadScene, saveScene } from "./scene";
import { getEditorReady, getEditorError } from "./editor";
import { loadEditorUrl, saveEditorUrl } from "./editorState";

export function registerIpcHandlers(): void {
  ipcMain.handle("scene:load", loadScene);
  ipcMain.handle("scene:save", (_event, json: string) => saveScene(json));
  ipcMain.handle("editor:ready?", () => getEditorReady());
  ipcMain.handle("editor:error?", () => getEditorError());
  ipcMain.handle("editor:url:load", () => loadEditorUrl());
  ipcMain.handle("editor:url:save", (_event, url: string) => saveEditorUrl(url));
}
