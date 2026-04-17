import { ipcMain } from "electron";
import { loadScene, saveScene } from "./scene";
import { getEditorReady, getEditorError } from "./editor";
import { loadEditorUrl, saveEditorUrl } from "./editorState";
import { spawnTerminal, writeTerminal, resizeTerminal } from "./pty";

export function registerIpcHandlers(): void {
  ipcMain.handle("scene:load", loadScene);
  ipcMain.handle("scene:save", (_event, json: string) => saveScene(json));
  ipcMain.handle("editor:ready?", () => getEditorReady());
  ipcMain.handle("editor:error?", () => getEditorError());
  ipcMain.handle("editor:url:load", () => loadEditorUrl());
  ipcMain.handle("editor:url:save", (_event, url: string) => saveEditorUrl(url));
  ipcMain.handle("terminal:spawn", (_event, id: string, cols: number, rows: number) =>
    spawnTerminal(id, cols, rows)
  );
  ipcMain.handle("terminal:write", (_event, id: string, data: string) => writeTerminal(id, data));
  ipcMain.handle("terminal:resize", (_event, id: string, cols: number, rows: number) =>
    resizeTerminal(id, cols, rows)
  );
}
