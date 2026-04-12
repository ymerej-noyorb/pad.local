# CLAUDE.md

Context for AI assistants working on this project.

---

## What is pad.local?

A local-first desktop dev workspace. Think pad.ws but stripped of all cloud complexity.
It runs entirely on the developer's machine — no server, no auth, no database, no infra cost.

The goal: any developer clones it, `npm install && npm run dev`, done.

**Prerequisites:** VS Code must be installed (macOS, Windows, Linux). WSL is not supported — VS Code's CLI in WSL is a remote wrapper that does not expose a web server.

---

## Core panels

| Panel       | Implementation                                                                     |
| ----------- | ---------------------------------------------------------------------------------- |
| Whiteboard  | Excalidraw fullscreen canvas — the panels live inside it as embeddable nodes       |
| Code editor | VS Code (`code serve-web`) on localhost:8080, embedded as an Excalidraw node        |
| Terminal    | PTY managed by `node-pty` (Electron main process), rendered via xterm.js as a node |

---

## Tech stack

| Layer         | Choice                        | Reason                                                            |
| ------------- | ----------------------------- | ----------------------------------------------------------------- |
| Desktop shell | Electron                      | Node.js only — `npm install && npm run dev`, zero extra toolchain |
| Backend       | Node.js (Electron main)       | Handles PTY (`node-pty`) and process spawning (`child_process`)   |
| Frontend      | React + TypeScript            | Familiar, component-based                                         |
| Whiteboard    | Excalidraw                    | Open source, embeddable, same approach as pad.ws                  |
| Editor        | VS Code `serve-web`           | Full VS Code experience, no extra install if VS Code is present          |
| Panels        | Excalidraw `renderEmbeddable` | Editor and terminal are nodes in the canvas, like pad.ws          |
| Bundler       | electron-vite                 | Vite for renderer, Electron-aware, fast HMR                       |

---

## What we explicitly ruled out

- ❌ Authentication (Keycloak or anything else) — single user, local machine
- ❌ Database (PostgreSQL or anything else) — JSON files for persistence
- ❌ Cloud / remote server — zero infra cost is a hard requirement
- ❌ Multi-tenant — one instance per developer, for that developer only
- ❌ OpenVSCode Server — no npm package, requires downloading a compiled binary
- ❌ code-server (Coder) — requires native build tools (`make`, `g++`) to compile argon2; not "Node.js only"
- ❌ WSL — VS Code CLI in WSL is a remote wrapper, does not expose `serve-web`; unsupported platform
- ❌ Monaco Editor — pad.ws used this; no extension support, not suitable for a daily driver
- ❌ allotment — replaced by Excalidraw's native embeddable system
- ❌ "Open in VS Code" button — breaks the single-window experience, defeats the purpose
- ❌ JetBrains IDEs (IntelliJ, WebStorm, PyCharm…) — Projector (their web-streaming solution) was deprecated in 2023; JetBrains Gateway is heavy and remote-dev oriented; no lightweight local `serve-web` equivalent exists
- ❌ Zed — no web UI, no HTTP server mode; cannot be embedded in an iframe
- ❌ Window streaming (Xpra, VNC-over-WebSocket) — the only generic approach for embedding any desktop IDE, but adds significant complexity, latency, and native dependencies; contradicts the "npm install && done" principle

---

## IDE support scope

The Editor panel embeds an IDE via `<webview src="http://localhost:PORT">`. This requires the IDE to expose a local HTTP server serving a full web UI — a capability specific to VS Code and its forks.

**Supported (or trivially supportable):**
- VS Code — the default, uses `code serve-web`
- Cursor — VS Code fork, inherits `serve-web`; only binary detection differs
- Windsurf — VS Code fork, same as Cursor

**Not supported:**
- Terminal-based editors (Neovim, Vim, Helix, Emacs…) — already usable via the Terminal panel; no dedicated Editor node needed
- JetBrains IDEs, Zed, and any other desktop IDE without a `serve-web` equivalent — see "ruled out" above

---

## Key behaviors

- On app launch: Electron main spawns `code serve-web` on port 8080 and opens a PTY via `node-pty`
- On app close: Electron kills both processes cleanly
- The user can add Editor and Terminal nodes anywhere on the Excalidraw canvas via a toolbar
- Nodes are draggable and resizable directly in the canvas (Excalidraw handles it)
- During canvas pan/scroll, embedded iframes have `pointer-events: none` to avoid capture
- Excalidraw scene (elements + positions) is auto-saved to a local JSON file on change

---

## Code conventions

- Always use semicolons at the end of statements (enforced by Prettier).
- Every file that contains user-visible text must declare a `TEXT` constant grouping all its strings. Strings are then referenced via `TEXT.key` — never inline.
- All colors are defined in `src/renderer/src/theme.ts` (Catppuccin Mocha tokens). Never hardcode color values inline — always import from `theme.ts`.
- No magic numbers inline — extract numeric values into named constants (`SCREAMING_SNAKE_CASE`).
- Constants used in a single file are declared at the top of that file. Only create a shared external file when a constant is used across multiple files.
- Code must be KISS and readable. Prefer explicit names over abbreviations: `element` not `el`, `index` not `i`, `error` not `err`, etc.

---

## Inspiration

[pad.ws](https://github.com/coderamp-labs/pad.ws) — original project, abandoned (last commit Aug 2025, site down as of Apr 2026).
pad.local is a simpler, local-only reimagining of the same idea.
