import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const api = {
  saveScene: (json: string): Promise<void> => ipcRenderer.invoke("scene:save", json),
  loadScene: (): Promise<string | null> => ipcRenderer.invoke("scene:load"),
};

contextBridge.exposeInMainWorld("electron", electronAPI);
contextBridge.exposeInMainWorld("api", api);
