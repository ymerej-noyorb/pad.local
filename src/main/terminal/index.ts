import { spawn } from "node-pty";
import type { IPty } from "node-pty";
import { BrowserWindow } from "electron";
import { loadTerminalCwds, saveTerminalCwds } from "./state";

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;
const CWD_SAVE_DEBOUNCE_MS = 1000;

// OSC 7 sequences emitted by zsh and fish on every directory change:
// ESC ] 7 ; file://hostname/path BEL   or   ESC ] 7 ; file://hostname/path ESC \
// eslint-disable-next-line no-control-regex
const OSC7_REGEX = /\x1b\]7;([^\x07\x1b]+)(?:\x07|\x1b\\)/g;

const sessions = new Map<string, IPty>();
const cwds: Record<string, string> = loadTerminalCwds();
let cwdSaveTimer: ReturnType<typeof setTimeout> | undefined;

function parseCwdFromOsc7(uri: string): string | null {
  try {
    const url = new URL(uri);
    if (url.protocol !== "file:") return null;
    let path = decodeURIComponent(url.pathname);
    // Windows: file:///C:/path → pathname is /C:/path — strip leading slash
    if (process.platform === "win32" && /^\/[A-Za-z]:/.test(path)) {
      path = path.slice(1);
    }
    return path;
  } catch {
    return null;
  }
}

function trackCwd(id: string, data: string): void {
  OSC7_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = OSC7_REGEX.exec(data)) !== null) {
    const cwd = parseCwdFromOsc7(match[1]);
    if (cwd) {
      cwds[id] = cwd;
      clearTimeout(cwdSaveTimer);
      cwdSaveTimer = setTimeout(() => saveTerminalCwds(cwds), CWD_SAVE_DEBOUNCE_MS);
    }
  }
}

export function spawnTerminal(id: string, shell: string, cols: number, rows: number): void {
  if (sessions.has(id)) return;

  const cwd = cwds[id] ?? process.env.HOME ?? process.env.USERPROFILE ?? process.cwd();

  let pty: IPty;
  try {
    pty = spawn(shell, [], {
      name: "xterm-color",
      cols: cols || DEFAULT_COLS,
      rows: rows || DEFAULT_ROWS,
      cwd,
      env: process.env as Record<string, string>
    });
  } catch (error) {
    console.error(
      `[terminal:${id}] Failed to spawn shell "${shell}":`,
      error instanceof Error ? error.message : String(error)
    );
    return;
  }

  pty.onData((data) => {
    trackCwd(id, data);
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
