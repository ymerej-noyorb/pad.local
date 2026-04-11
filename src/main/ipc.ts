import { ipcMain } from "electron";
import { loadScene, saveScene } from "./scene";
import { getEditorReady } from "./editor";

export function registerIpcHandlers(): void {
  ipcMain.handle("scene:load", loadScene);
  ipcMain.handle("scene:save", (_event, json: string) => saveScene(json));
  ipcMain.handle("editor:ready?", () => getEditorReady());
}
