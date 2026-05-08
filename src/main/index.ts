import { join, dirname } from "path";
import { existsSync } from "fs";
import { app, BrowserWindow } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { createWindow } from "./window";
import { registerIpcHandlers } from "./ipc";
import { stopAllEditors } from "./editor";
import { killAllTerminals } from "./terminal";
import { loadWorkspaces } from "./workspaces";

// Detect portable mode: a .portable marker is placed next to the exe by the afterPack hook.
// Program Files installs (NSIS) also get the marker since afterPack runs for all targets,
// so we exclude them explicitly to avoid false positives.
function getPortableDataDir(): string | null {
  if (!app.isPackaged) return null;
  const exeDir = dirname(process.execPath);
  if (!existsSync(join(exeDir, ".portable"))) return null;
  const progFiles = (process.env.ProgramFiles ?? "C:\\Program Files").toLowerCase();
  const progFilesX86 = (
    process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)"
  ).toLowerCase();
  const exeDirLower = exeDir.toLowerCase();
  if (exeDirLower.startsWith(progFiles) || exeDirLower.startsWith(progFilesX86)) return null;
  return join(exeDir, "padlocal-data");
}

const portableDataDir = getPortableDataDir();
if (portableDataDir) {
  app.setPath("userData", portableDataDir);
  app.commandLine.appendSwitch("user-data-dir", portableDataDir);
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  app.on("browser-window-created", (_event, browserWindow) => {
    optimizer.watchWindowShortcuts(browserWindow);
  });

  loadWorkspaces();
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  stopAllEditors();
  killAllTerminals();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
