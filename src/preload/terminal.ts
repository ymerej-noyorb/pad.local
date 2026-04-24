import { contextBridge, ipcRenderer } from "electron";

const terminalApi = {
  terminalSpawn: (id: string, shell: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke("terminal:spawn", id, shell, cols, rows),
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

contextBridge.exposeInMainWorld("terminalApi", terminalApi);
