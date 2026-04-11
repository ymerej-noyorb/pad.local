import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import http from "http";
import { BrowserWindow } from "electron";

const VSCODE_PORT = 8080;
const VSCODE_ARGS = [
  "serve-web",
  "--port", String(VSCODE_PORT),
  "--without-connection-token",
  "--accept-server-license-terms",
];
const POLL_INTERVAL_MS = 500;

const MACOS_BINARY_CANDIDATES = [
  "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
  "/usr/local/bin/code",       // Intel — installed via VS Code command palette
  "/opt/homebrew/bin/code",    // Apple Silicon — Homebrew
];

function findCodeBinary(): string {
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const windowsDefault = join(localAppData, "Programs", "Microsoft VS Code", "bin", "code.cmd");
      if (existsSync(windowsDefault)) return windowsDefault;
    }
    return "code.cmd";
  }

  if (process.platform === "darwin") {
    for (const candidate of MACOS_BINARY_CANDIDATES) {
      if (existsSync(candidate)) return candidate;
    }
    return "code";
  }

  // Linux
  return "code";
}

let editorProcess: ChildProcess | null = null;
let editorReady = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopPoll(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPoll(): void {
  pollTimer = setInterval(() => {
    http
      .get(`http://localhost:${VSCODE_PORT}`, (response) => {
        response.resume();
        if (editorReady) return; // in-flight duplicate — already handled
        stopPoll();
        editorReady = true;
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send("editor:ready");
        });
      })
      .on("error", () => {
        // VS Code not ready yet — keep polling
      });
  }, POLL_INTERVAL_MS);
}

function spawnEditor(binary: string): ChildProcess {
  // On Windows, .cmd files cannot be spawned directly by CreateProcess —
  // they must go through cmd.exe. Passing the binary as a separate argument
  // lets Node.js correctly quote paths that contain spaces.
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/c", binary, ...VSCODE_ARGS], { stdio: "ignore" });
  }
  return spawn(binary, VSCODE_ARGS, { stdio: "ignore" });
}

export function startEditor(): void {
  if (editorProcess) return;

  const binary = findCodeBinary();
  editorProcess = spawnEditor(binary);

  editorProcess.on("error", (error) => {
    console.error("[editor] Failed to start VS Code serve-web:", error.message);
    editorProcess = null;
    stopPoll();
  });

  editorProcess.on("exit", () => {
    editorProcess = null;
    editorReady = false;
  });

  startPoll();
}

export function stopEditor(): void {
  stopPoll();
  editorReady = false;
  if (editorProcess) {
    editorProcess.kill();
    editorProcess = null;
  }
}

export function getEditorReady(): boolean {
  return editorReady;
}
