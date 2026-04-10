import { ipcMain } from "electron";
import { loadScene, saveScene } from "./scene";

export function registerIpcHandlers(): void {
  ipcMain.handle("scene:load", loadScene);
  ipcMain.handle("scene:save", (_event, json: string) => saveScene(json));
}
