import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { join } from "path";
import type { EditorType, EditorInfo, ShellInfo } from "../shared/types";

const api = {
  saveScene: (json: string): Promise<void> => ipcRenderer.invoke("scene:save", json),
  loadScene: (): Promise<string | null> => ipcRenderer.invoke("scene:load"),

  detectEditors: (): Promise<EditorInfo[]> => ipcRenderer.invoke("editor:detect"),
  startEditor: (type: EditorType): Promise<void> => ipcRenderer.invoke("editor:start", type),
  checkEditorReady: (type: EditorType): Promise<boolean> =>
    ipcRenderer.invoke("editor:ready?", type),
  onEditorReady: (callback: (type: EditorType) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, type: EditorType): void => callback(type);
    ipcRenderer.on("editor:ready", handler);
    return () => {
      ipcRenderer.removeListener("editor:ready", handler);
    };
  },
  checkEditorError: (type: EditorType): Promise<boolean> =>
    ipcRenderer.invoke("editor:error?", type),
  onEditorError: (callback: (type: EditorType) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, type: EditorType): void => callback(type);
    ipcRenderer.on("editor:error", handler);
    return () => {
      ipcRenderer.removeListener("editor:error", handler);
    };
  },
  getEditorPort: (type: EditorType): Promise<number> => ipcRenderer.invoke("editor:port", type),
  loadEditorUrl: (type: EditorType): Promise<string | null> =>
    ipcRenderer.invoke("editor:url:load", type),
  saveEditorUrl: (type: EditorType, url: string): Promise<void> =>
    ipcRenderer.invoke("editor:url:save", type, url),

  detectShells: (): Promise<ShellInfo[]> => ipcRenderer.invoke("shell:detect"),

  terminalSpawn: (id: string, shell: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke("terminal:spawn", id, shell, cols, rows),
  terminalWrite: (id: string, data: string): Promise<void> =>
    ipcRenderer.invoke("terminal:write", id, data),
  terminalResize: (id: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke("terminal:resize", id, cols, rows),
  browserSetTouchEmulation: (webContentsId: number, enabled: boolean): Promise<void> =>
    ipcRenderer.invoke("browser:setTouchEmulation", webContentsId, enabled),
  getCursorPosition: (): Promise<{ x: number; y: number }> =>
    ipcRenderer.invoke("cursor:getPosition"),

  terminalPreloadPath: join(__dirname, "terminal.js"),

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
