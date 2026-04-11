import { spawn, execSync } from "child_process";
import type { ChildProcess } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import http from "http";
import { BrowserWindow } from "electron";

const VSCODE_PORT = 8080;
const POLL_INTERVAL_MS = 500;

const MACOS_BINARY_CANDIDATES = [
  "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
  "/usr/local/bin/code",       // Intel — installed via VS Code command palette
  "/opt/homebrew/bin/code",    // Apple Silicon — Homebrew
];

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

  killPortIfInUse(VSCODE_PORT);

  const binary = findCodeBinary();
  const args = buildVSCodeArgs(VSCODE_PORT);
  editorProcess = spawnEditor(binary, args);

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
