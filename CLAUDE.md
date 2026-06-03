# CLAUDE.md

Context for AI assistants working on this project.

---

## What is pad.local?

A local-first desktop dev workspace. Think pad.ws but stripped of all cloud complexity.
It runs entirely on the developer's machine — no server, no auth, no database, no infra cost.

The goal: any developer clones it, `npm install && npm run dev`, done.

**Prerequisites:** Node.js 20.19+ (24 LTS recommended) and at least one of VS Code, Cursor, Windsurf, or VSCodium installed (macOS, Windows, Linux). WSL is not supported — VS Code's CLI in WSL is a remote wrapper that does not expose a web server.

**VS Code version constraint:** VS Code 1.119.0 introduced a regression ([issue #315003](https://github.com/microsoft/vscode/issues/315003)) that breaks `serve-web` on localhost — the extension host WebSocket upgrade fails, causing an endless "Time limit reached" error in the Editor panel. Fixed in 1.121.0 ([PR #315802](https://github.com/microsoft/vscode/pull/315802)). Use **VS Code ≤ 1.118.x or ≥ 1.121.0**. This affects serve-web regardless of whether it is launched from pad.local or directly from the terminal, and also reproduces in regular browsers — it is not an Electron/pad.local bug.

---

## Core panels

| Panel       | Implementation                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| Whiteboard  | Excalidraw fullscreen canvas — the panels live inside it as embeddable nodes                                                |
| Code editor | VS Code fork (`serve-web`) — user picks VS Code, Cursor, Windsurf, or VSCodium                                              |
| Terminal    | PTY managed by `node-pty` (Electron main process), rendered via xterm.js in a dedicated `<webview>` (`terminal.html`)       |
| AI          | Provider web UI in a `<webview>` node — user picks from a curated list of AI providers                                      |
| Browser     | Generic `<webview>` with address bar, device presets, touch simulation, and DevTools — for local responsive dev and testing |

---

## Tech stack

| Layer         | Choice                        | Reason                                                            |
| ------------- | ----------------------------- | ----------------------------------------------------------------- |
| Desktop shell | Electron                      | Node.js only — `npm install && npm run dev`, zero extra toolchain |
| Backend       | Node.js (Electron main)       | Handles PTY (`node-pty`) and process spawning (`child_process`)   |
| Frontend      | React + TypeScript            | Familiar, component-based                                         |
| Whiteboard    | Excalidraw                    | Open source, embeddable, same approach as pad.ws                  |
| Editor        | VS Code `serve-web`           | Full VS Code experience, no extra install if VS Code is present   |
| Panels        | Excalidraw `renderEmbeddable` | Editor, terminal, AI, and browser are nodes in the canvas         |
| Bundler       | electron-vite                 | Vite for renderer, Electron-aware, fast HMR                       |

---

## Inspiration

[pad.ws](https://github.com/coderamp-labs/pad.ws) — the original inspiration. pad.local is a simpler, local-only reimagining of the same idea.

[ai-assistant-electron](https://github.com/Andaroth/ai-assistant-electron) — inspired the `partition="persist:ai-<providerId>"` pattern for isolated per-provider cookie stores in the AI panel.
