import { spawn } from "node-pty";
import type { IPty } from "node-pty";
import { BrowserWindow } from "electron";
import { existsSync } from "fs";
import { join } from "path";

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;

const POWERSHELL_CANDIDATES = [
  join(process.env.PROGRAMFILES ?? "C:\\Program Files", "PowerShell", "7", "pwsh.exe"),
  join(process.env.SYSTEMROOT ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe"),
];

function defaultShell(): string {
  if (process.platform !== "win32") return process.env.SHELL ?? "/bin/bash";
  for (const candidate of POWERSHELL_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  return process.env.COMSPEC ?? "cmd.exe";
}

const sessions = new Map<string, IPty>();

export function spawnTerminal(id: string, cols: number, rows: number): void {
  if (sessions.has(id)) return;

  const pty = spawn(defaultShell(), [], {
    name: "xterm-color",
    cols: cols || DEFAULT_COLS,
    rows: rows || DEFAULT_ROWS,
    cwd: process.env.HOME ?? process.env.USERPROFILE ?? process.cwd(),
    env: process.env as Record<string, string>
  });

  pty.onData((data) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("terminal:data", { id, data });
    });
  });

  pty.onExit(() => {
    sessions.delete(id);
  });

  sessions.set(id, pty);
}

export function writeTerminal(id: string, data: string): void {
  sessions.get(id)?.write(data);
}

export function resizeTerminal(id: string, cols: number, rows: number): void {
  sessions.get(id)?.resize(cols, rows);
}

export function killAllTerminals(): void {
  sessions.forEach((pty) => pty.kill());
  sessions.clear();
}
