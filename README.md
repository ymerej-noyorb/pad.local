# pad.local

> Your local-first dev workspace. Build once, everything you need, zero infrastructure cost.

pad.local is a desktop app inspired by [pad.ws](https://github.com/coderamp-labs/pad.ws), stripped down to its essence: a whiteboard, a code editor, and a terminal — all in one window, running entirely on your machine.

No cloud. No auth. No database. No monthly bill.

---

## What's inside

| Panel          | Tech                                                        |
| -------------- | ----------------------------------------------------------- |
| 🎨 Whiteboard  | Excalidraw — the canvas everything lives in                 |
| 💻 Code editor | VS Code (`serve-web`) — your extensions, your settings |
| 🖥️ Terminal    | xterm.js + node-pty                                         |

The editor and terminal live as nodes inside the Excalidraw canvas — drag them anywhere, resize them, draw around them.

---

## Getting started

```bash
git clone https://github.com/ymerej-noyorb/pad.local
cd pad.local
npm install
npm run dev
```

Prerequisites: Node.js v24 LTS (v24.14.1+) and VS Code installed on your machine.

Supported platforms: macOS, Windows, Linux. **WSL is not supported.**

---

## Building for distribution

```bash
npm run build
```

Produces a native executable for your OS (`.dmg` on macOS, `.exe` on Windows, `.AppImage` on Linux).

---

## Stack

- **[Electron](https://www.electronjs.org/)** — Desktop shell
- **[React](https://react.dev/) + TypeScript** — UI
- **[electron-vite](https://electron-vite.org/)** — Build tooling
- **[Excalidraw](https://github.com/excalidraw/excalidraw)** — Fullscreen canvas
- **[VS Code](https://code.visualstudio.com/)** — Editor, served via `code serve-web`
- **[xterm.js](https://xtermjs.org/) + [node-pty](https://github.com/microsoft/node-pty)** — Terminal

---

## How it works

When you launch pad.local, Electron:

1. Spawns `code serve-web` on port 8080 (requires VS Code installed)
2. Loads Excalidraw fullscreen — add Editor and Terminal nodes anywhere on the canvas

Everything runs locally. Nothing leaves your machine.

---

## Persistence

- Excalidraw scene (elements, positions) → saved as a local JSON file
- Editor / terminal → your actual filesystem, no abstraction

---

## Design principles

- **Local first** — works offline, always
- **Zero infra** — no server, no database, no auth
- **Clone and run** — Node.js + VS Code are the only prerequisites

---

## Known limitations

- **Export image** — The "Export image" feature captures annotations, shapes, and canvas layout correctly. However, the Editor and Terminal panels will appear as empty frames — they run in separate renderer processes (Electron `<webview>`) and cannot be composited into a canvas export.
- **WSL not supported** — VS Code's CLI in WSL is a remote wrapper that does not expose `serve-web`.

---

## Inspired by

[pad.ws](https://github.com/coderamp-labs/pad.ws) — great concept, now abandoned (last commit Aug 2025, site down). pad.local is the "just run it" version.
