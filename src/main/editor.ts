import { spawn, execSync } from "child_process";
import type { ChildProcess } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import http from "http";
import { BrowserWindow } from "electron";
import { EDITOR_PORTS } from "./constants";
import { getEditorBinary } from "./editorDetect";
import type { EditorType } from "../shared/types";

const POLL_INTERVAL_MS = 500;

interface EditorSession {
  process: ChildProcess;
  port: number;
  ready: boolean;
  pollTimer: ReturnType<typeof setInterval> | null;
}

const sessions = new Map<EditorType, EditorSession>();

function findDesktopSettingsPath(type: EditorType): string | null {
  const appNames: Record<EditorType, string> = {
    vscode: "Code",
    cursor: "Cursor",
    windsurf: "Windsurf",
    vscodium: "VSCodium"
  };
  const appName = appNames[type];

  if (process.platform === "win32") {
    const appData = process.env.APPDATA;
    return appData ? join(appData, appName, "User", "settings.json") : null;
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", appName, "User", "settings.json");
  }
  return join(homedir(), ".config", appName, "User", "settings.json");
}

function syncDesktopSettings(type: EditorType): void {
  try {
    const desktopSettingsPath = findDesktopSettingsPath(type);
    if (!desktopSettingsPath || !existsSync(desktopSettingsPath)) return;

    const serverDataDir = getServerDataDir(type);
    if (!serverDataDir) return;

    const machineSettingsDir = join(serverDataDir, "data", "Machine");
    mkdirSync(machineSettingsDir, { recursive: true });
    writeFileSync(join(machineSettingsDir, "settings.json"), readFileSync(desktopSettingsPath));
  } catch {
    // Non-critical — serve-web will fall back to its own defaults.
  }
}

function getServerDataDir(type: EditorType): string | null {
  const dirs: Record<EditorType, string> = {
    vscode: join(homedir(), ".vscode"),
    cursor: join(homedir(), ".cursor"),
    windsurf: join(homedir(), ".windsurf"),
    vscodium: join(homedir(), ".vscodium")
  };
  const dir = dirs[type];
  return existsSync(dir) ? dir : null;
}

function buildServeWebArgs(type: EditorType, port: number): string[] {
  const args = [
    "serve-web",
    "--port",
    String(port),
    "--without-connection-token",
    "--accept-server-license-terms"
  ];

  const serverDataDir = getServerDataDir(type);
  if (serverDataDir) {
    args.push("--server-data-dir", serverDataDir);
  }

  return args;
}

function killPortIfInUse(port: number): void {
  if (process.platform === "win32") {
    let output: string;
    try {
      // netstat output is piped into findstr; findstr exits with code 1 (no match) if port is free.
      output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    } catch {
      return;
    }
    const pids = new Set(
      output
        .split("\n")
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid): pid is string => !!pid && /^\d+$/.test(pid))
    );
    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } catch {
        // Process already gone.
      }
    });
  } else {
    try {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
    } catch {
      // No process on the port.
    }
  }
}

function spawnProcess(binary: string, args: string[]): ChildProcess {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/c", binary, ...args], { stdio: "ignore" });
  }
  return spawn(binary, args, { stdio: "ignore" });
}

function stopPoll(session: EditorSession): void {
  if (session.pollTimer) {
    clearInterval(session.pollTimer);
    session.pollTimer = null;
  }
}

function broadcastReady(type: EditorType): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send("editor:ready", type);
  });
}

function broadcastError(type: EditorType): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send("editor:error", type);
  });
}

export function startEditor(type: EditorType): void {
  if (sessions.has(type)) return;

  syncDesktopSettings(type);

  const port = EDITOR_PORTS[type];
  killPortIfInUse(port);

  const binary = getEditorBinary(type);
  if (!binary) {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("editor:error", type);
    });
    return;
  }

  const args = buildServeWebArgs(type, port);
  const process = spawnProcess(binary, args);

  const session: EditorSession = { process, port, ready: false, pollTimer: null };
  sessions.set(type, session);

  process.on("error", (error) => {
    console.error(`[editor:${type}] Failed to start serve-web:`, error.message);
    sessions.delete(type);
    broadcastError(type);
  });

  process.on("exit", () => {
    sessions.delete(type);
  });

  session.pollTimer = setInterval(() => {
    http
      .get(`http://localhost:${port}`, (response) => {
        response.resume();
        const current = sessions.get(type);
        if (!current || current.ready) return;
        stopPoll(current);
        current.ready = true;
        broadcastReady(type);
      })
      .on("error", () => {
        // Not ready yet — keep polling.
      });
  }, POLL_INTERVAL_MS);
}

export function getEditorReady(type: EditorType): boolean {
  return sessions.get(type)?.ready ?? false;
}

export function getEditorError(): boolean {
  return false;
}

export function getEditorPort(type: EditorType): number {
  return EDITOR_PORTS[type];
}

export function stopEditor(type: EditorType): void {
  const session = sessions.get(type);
  if (!session) return;
  stopPoll(session);
  session.process.kill();
  sessions.delete(type);
}

export function stopAllEditors(): void {
  sessions.forEach((_session, type) => stopEditor(type));
}
