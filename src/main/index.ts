import { app, BrowserWindow } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { createWindow } from "./window";
import { registerIpcHandlers } from "./ipc";
import { startEditor, stopEditor } from "./editor";

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  app.on("browser-window-created", (_event, browserWindow) => {
    optimizer.watchWindowShortcuts(browserWindow);
  });

  registerIpcHandlers();
  startEditor();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  stopEditor();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
