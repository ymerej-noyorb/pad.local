import { join } from "path";
import { app, BrowserWindow } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { createWindow } from "./window";
import { registerIpcHandlers } from "./ipc";
import { stopAllEditors } from "./editor";
import { killAllTerminals } from "./terminal";
import { loadWorkspaces } from "./workspaces";

// Redirect userData to a local "data" folder next to the exe when running as portable.
// electron-builder sets PORTABLE_EXECUTABLE_DIR only for the portable target.
// Must be called before app.whenReady() so every subsequent app.getPath("userData") call
// resolves to the portable path instead of %APPDATA%.
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  app.setPath("userData", join(process.env.PORTABLE_EXECUTABLE_DIR, "data"));
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
