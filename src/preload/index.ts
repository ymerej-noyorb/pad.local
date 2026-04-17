import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const api = {
  saveScene: (json: string): Promise<void> => ipcRenderer.invoke("scene:save", json),
  loadScene: (): Promise<string | null> => ipcRenderer.invoke("scene:load"),
  checkEditorReady: (): Promise<boolean> => ipcRenderer.invoke("editor:ready?"),
  onEditorReady: (callback: () => void): void => {
    ipcRenderer.once("editor:ready", callback);
  },
  checkEditorError: (): Promise<boolean> => ipcRenderer.invoke("editor:error?"),
  onEditorError: (callback: () => void): void => {
    ipcRenderer.once("editor:error", callback);
  },
  loadEditorUrl: (): Promise<string | null> => ipcRenderer.invoke("editor:url:load"),
  saveEditorUrl: (url: string): Promise<void> => ipcRenderer.invoke("editor:url:save", url),
  terminalSpawn: (id: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke("terminal:spawn", id, cols, rows),
  terminalWrite: (id: string, data: string): Promise<void> =>
    ipcRenderer.invoke("terminal:write", id, data),
  terminalResize: (id: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke("terminal:resize", id, cols, rows),
  onTerminalData: (callback: (id: string, data: string) => void): (() => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { id: string; data: string }
    ): void => {
      callback(payload.id, payload.data);
    };
    ipcRenderer.on("terminal:data", handler);
    return () => {
      ipcRenderer.removeListener("terminal:data", handler);
    };
  }
};

contextBridge.exposeInMainWorld("electron", electronAPI);
contextBridge.exposeInMainWorld("api", api);
