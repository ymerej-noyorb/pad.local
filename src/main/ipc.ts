import { ipcMain, webContents, screen, BrowserWindow, dialog } from "electron";
import { loadScene, saveScene } from "./scene";
import { startEditor, getEditorReady, getEditorError, getEditorPort } from "./editor";
import { loadEditorUrl, saveEditorUrl } from "./editor/state";
import { detectEditors } from "./editor/detect";
import { detectShells } from "./terminal/detect";
import { spawnTerminal, writeTerminal, resizeTerminal } from "./terminal";
import {
  getWorkspacesState,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  switchWorkspace
} from "./workspaces";
import {
  listDataFiles,
  readDataFile,
  deleteDataFile,
  openStorageFolder,
  getStoragePath,
  exportData,
  importData
} from "./storage";
import type { EditorType } from "../shared/types";

export function registerIpcHandlers(): void {
  ipcMain.handle("workspace:list", () => getWorkspacesState());
  ipcMain.handle("workspace:create", (_event, name: string) => createWorkspace(name));
  ipcMain.handle("workspace:rename", (_event, id: string, name: string) =>
    renameWorkspace(id, name)
  );
  ipcMain.handle("workspace:delete", (_event, id: string) => deleteWorkspace(id));
  ipcMain.handle("workspace:switch", (_event, id: string) => switchWorkspace(id));

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
    (_event, id: string, shell: string, cols: number, rows: number) => {
      const allowedPaths = detectShells().map((shellInfo) => shellInfo.path);
      if (!allowedPaths.includes(shell)) return;
      spawnTerminal(id, shell, cols, rows);
    }
  );
  ipcMain.handle("terminal:write", (_event, id: string, data: string) => writeTerminal(id, data));
  ipcMain.handle("terminal:resize", (_event, id: string, cols: number, rows: number) =>
    resizeTerminal(id, cols, rows)
  );

  ipcMain.handle("cursor:getPosition", () => {
    const cursorPos = screen.getCursorScreenPoint();
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const contentBounds = win?.getContentBounds() ?? { x: 0, y: 0 };
    return { x: cursorPos.x - contentBounds.x, y: cursorPos.y - contentBounds.y };
  });

  ipcMain.handle("storage:path", () => getStoragePath());
  ipcMain.handle("storage:list", () => listDataFiles());
  ipcMain.handle("storage:read", (_event, name: string) => readDataFile(name));
  ipcMain.handle("storage:delete", (_event, name: string) => deleteDataFile(name));
  ipcMain.handle("storage:openFolder", () => openStorageFolder());

  ipcMain.handle("storage:export", async () => {
    const date = new Date().toISOString().slice(0, 10);
    const result = await dialog.showSaveDialog({
      title: "Export app data",
      defaultPath: `padlocal-backup-${date}.json`,
      filters: [{ name: "pad.local backup", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePath) return { success: false };
    exportData(result.filePath);
    return { success: true };
  });

  ipcMain.handle("storage:import", async () => {
    const result = await dialog.showOpenDialog({
      title: "Import app data",
      filters: [{ name: "pad.local backup", extensions: ["json"] }],
      properties: ["openFile"]
    });
    if (result.canceled || !result.filePaths[0]) return { success: false };
    const filesImported = importData(result.filePaths[0]);
    return { success: true, filesImported };
  });

  ipcMain.handle(
    "browser:setTouchEmulation",
    async (_event, webContentsId: number, enabled: boolean) => {
      const wc = webContents.fromId(webContentsId);
      if (!wc) return;
      try {
        if (!wc.debugger.isAttached()) wc.debugger.attach("1.3");
        await wc.debugger.sendCommand("Emulation.setTouchEmulationEnabled", {
          enabled,
          maxTouchPoints: 5
        });
        await wc.debugger.sendCommand("Emulation.setEmitTouchEventsForMouse", {
          enabled,
          configuration: "mobile"
        });
      } catch {
        // DevTools is open and holds the debugger — silently skip
      }
    }
  );
}
