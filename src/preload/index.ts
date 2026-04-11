import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const api = {
  saveScene: (json: string): Promise<void> => ipcRenderer.invoke("scene:save", json),
  loadScene: (): Promise<string | null> => ipcRenderer.invoke("scene:load"),
  checkEditorReady: (): Promise<boolean> => ipcRenderer.invoke("editor:ready?"),
  onEditorReady: (callback: () => void): void => { ipcRenderer.once("editor:ready", callback); },
  checkEditorError: (): Promise<boolean> => ipcRenderer.invoke("editor:error?"),
  onEditorError: (callback: () => void): void => { ipcRenderer.once("editor:error", callback); },
  loadEditorUrl: (): Promise<string | null> => ipcRenderer.invoke("editor:url:load"),
  saveEditorUrl: (url: string): Promise<void> => ipcRenderer.invoke("editor:url:save", url),
};

contextBridge.exposeInMainWorld("electron", electronAPI);
contextBridge.exposeInMainWorld("api", api);
