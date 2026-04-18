import { spawn } from "node-pty";
import type { IPty } from "node-pty";
import { BrowserWindow } from "electron";

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;

const sessions = new Map<string, IPty>();

export function spawnTerminal(id: string, shell: string, cols: number, rows: number): void {
  if (sessions.has(id)) return;

  const pty = spawn(shell, [], {
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
