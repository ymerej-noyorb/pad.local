import { ipcMain } from "electron";
import { loadScene, saveScene } from "./scene";
import { startEditor, getEditorReady, getEditorError, getEditorPort } from "./editor";
import { loadEditorUrl, saveEditorUrl } from "./editorState";
import { detectEditors } from "./editorDetect";
import { detectShells } from "./shellDetect";
import { spawnTerminal, writeTerminal, resizeTerminal } from "./pty";
import type { EditorType } from "../shared/types";

export function registerIpcHandlers(): void {
  ipcMain.handle("scene:load", loadScene);
  ipcMain.handle("scene:save", (_event, json: string) => saveScene(json));

  ipcMain.handle("editor:detect", () => detectEditors());
  ipcMain.handle("editor:start", (_event, type: EditorType) => startEditor(type));
  ipcMain.handle("editor:ready?", (_event, type: EditorType) => getEditorReady(type));
  ipcMain.handle("editor:error?", (_event, type: EditorType) => getEditorError(type));
  ipcMain.handle("editor:port", (_event, type: EditorType) => getEditorPort(type));
  ipcMain.handle("editor:url:load", (_event, type: EditorType) => loadEditorUrl(type));
  ipcMain.handle("editor:url:save", (_event, type: EditorType, url: string) =>
    saveEditorUrl(type, url)
  );

  ipcMain.handle("shell:detect", () => detectShells());

  ipcMain.handle(
    "terminal:spawn",
    (_event, id: string, shell: string, cols: number, rows: number) =>
      spawnTerminal(id, shell, cols, rows)
  );
  ipcMain.handle("terminal:write", (_event, id: string, data: string) => writeTerminal(id, data));
  ipcMain.handle("terminal:resize", (_event, id: string, cols: number, rows: number) =>
    resizeTerminal(id, cols, rows)
  );
}
