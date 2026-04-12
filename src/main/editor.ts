import { spawn, execSync } from "child_process";
import type { ChildProcess } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import http from "http";
import { BrowserWindow } from "electron";
import { VSCODE_PORT } from "./constants";

const POLL_INTERVAL_MS = 500;

const MACOS_BINARY_CANDIDATES = [
  "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
  "/usr/local/bin/code",       // Intel — installed via VS Code command palette
  "/opt/homebrew/bin/code",    // Apple Silicon — Homebrew
];

function findDesktopSettingsPath(): string | null {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA;
    return appData ? join(appData, "Code", "User", "settings.json") : null;
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "Code", "User", "settings.json");
  }
  // Linux
  return join(homedir(), ".config", "Code", "User", "settings.json");
}

// Copies the Desktop VS Code settings.json to the Machine-level settings path that
// serve-web reads on startup. Machine settings have lower priority than user settings
// (stored in IndexedDB), so any override made inside the web UI is preserved.
function syncDesktopSettings(): void {
  try {
    const desktopSettingsPath = findDesktopSettingsPath();
    if (!desktopSettingsPath || !existsSync(desktopSettingsPath)) return;

    const machineSettingsDir = join(homedir(), ".vscode", "data", "Machine");
    mkdirSync(machineSettingsDir, { recursive: true });
    writeFileSync(join(machineSettingsDir, "settings.json"), readFileSync(desktopSettingsPath));
  } catch (_) {
    // Non-critical — serve-web will fall back to its own defaults.
  }
}

function buildVSCodeArgs(port: number): string[] {
  const args = [
    "serve-web",
    "--port", String(port),
    "--without-connection-token",
    "--accept-server-license-terms",
  ];

  // Point serve-web at ~/.vscode so it picks up the user's installed extensions.
  // serve-web looks for extensions at <server-data-dir>/extensions/, and ~/.vscode/extensions
  // is exactly where VS Code Desktop stores them.
  // Note: --user-data-dir and --extensions-dir are not supported by serve-web.
  const vscodeDir = join(homedir(), ".vscode");
  if (existsSync(vscodeDir)) {
    args.push("--server-data-dir", vscodeDir);
  }

  return args;
}

function findCodeBinary(): string | null {
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const windowsDefault = join(localAppData, "Programs", "Microsoft VS Code", "bin", "code.cmd");
      if (existsSync(windowsDefault)) return windowsDefault;
    }
    try {
      execSync("where code.cmd", { stdio: "ignore" });
      return "code.cmd";
    } catch (_) {
      return null;
    }
  }

  if (process.platform === "darwin") {
    for (const candidate of MACOS_BINARY_CANDIDATES) {
      if (existsSync(candidate)) return candidate;
    }
    try {
      execSync("which code", { stdio: "ignore" });
      return "code";
    } catch (_) {
      return null;
    }
  }

  // Linux
  try {
    execSync("which code", { stdio: "ignore" });
    return "code";
  } catch (_) {
    return null;
  }
}

let editorProcess: ChildProcess | null = null;
let editorReady = false;
let editorError = false;
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

function spawnEditor(binary: string, args: string[]): ChildProcess {
  // On Windows, .cmd files cannot be spawned directly by CreateProcess —
  // they must go through cmd.exe. Passing the binary as a separate argument
  // lets Node.js correctly quote paths that contain spaces.
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/c", binary, ...args], { stdio: "ignore" });
  }
  return spawn(binary, args, { stdio: "ignore" });
}

// Kills any process occupying the given port before we start our own.
// Handles orphaned VS Code processes left over from previous dev sessions
// where the Electron main process was killed without running cleanup.
function killPortIfInUse(port: number): void {
  try {
    if (process.platform === "win32") {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      const pids = new Set(
        output.split("\n")
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid): pid is string => !!pid && /^\d+$/.test(pid))
      );
      pids.forEach((pid) => {
        try { execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" }); } catch (_) {}
      });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
    }
  } catch (_) {
    // No process on the port — nothing to clean up.
  }
}

export function startEditor(): void {
  if (editorProcess) return;

  syncDesktopSettings();
  killPortIfInUse(VSCODE_PORT);

  const binary = findCodeBinary();
  if (!binary) {
    editorError = true;
    return;
  }

  const args = buildVSCodeArgs(VSCODE_PORT);
  editorProcess = spawnEditor(binary, args);

  editorProcess.on("error", (error) => {
    console.error("[editor] Failed to start VS Code serve-web:", error.message);
    editorProcess = null;
    editorError = true;
    stopPoll();
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("editor:error");
    });
  });

  editorProcess.on("exit", () => {
    editorProcess = null;
    editorReady = false;
  });

  startPoll();
}

export function getEditorError(): boolean {
  return editorError;
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
