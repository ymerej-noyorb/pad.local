# pad.local

> Your local-first dev workspace. Build once, everything you need, zero infrastructure cost.

pad.local is a desktop app inspired by [pad.ws](https://github.com/coderamp-labs/pad.ws), stripped down to its essence: a whiteboard, a code editor, and a terminal — all in one window, running entirely on your machine.

No cloud. No auth. No database. No monthly bill.

---

## What's inside

| Panel          | Tech                                                        |
| -------------- | ----------------------------------------------------------- |
| 🎨 Whiteboard  | Excalidraw — the canvas everything lives in                 |
| 💻 Code editor | OpenVSCode Server — your extensions, your settings |
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

Prerequisites: Node.js v24 LTS (v24.14.1+).

- **WSL2**: Electron needs a few system libs not included in the default WSL2 install. Run once before `npm run dev`:
  ```bash
  sudo apt-get install -y libnspr4 libnss3 libasound2t64 --fix-missing
  ```

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
- **[OpenVSCode Server](https://github.com/gitpod-io/openvscode-server)** — Embeddable VS Code server (Gitpod fork)
- **[xterm.js](https://xtermjs.org/) + [node-pty](https://github.com/microsoft/node-pty)** — Terminal

---

## How it works

When you launch pad.local, Electron:

1. Starts an OpenVSCode Server instance on port 8080 (bundled — no external install needed)
2. Opens a PTY for the terminal via `node-pty`
3. Loads Excalidraw fullscreen — add Editor and Terminal nodes anywhere on the canvas

Everything runs locally. Nothing leaves your machine.

---

## Persistence

- Excalidraw scene (elements, positions) → saved as a local JSON file
- Editor / terminal → your actual filesystem, no abstraction

---

## Design principles

- **Local first** — works offline, always
- **Zero infra** — no server, no database, no auth
- **Clone and run** — Node.js is the only prerequisite

---

## Inspired by

[pad.ws](https://github.com/coderamp-labs/pad.ws) — great concept, now abandoned (last commit Aug 2025, site down). pad.local is the "just run it" version.
