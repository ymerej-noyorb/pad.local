# CLAUDE.md

Context for AI assistants working on this project.

---

## What is pad.local?

A local-first desktop dev workspace. Think pad.ws but stripped of all cloud complexity.
It runs entirely on the developer's machine — no server, no auth, no database, no infra cost.

The goal: any developer clones it, `npm install && npm run dev`, done.

---

## Core panels

| Panel       | Implementation                                                                     |
| ----------- | ---------------------------------------------------------------------------------- |
| Whiteboard  | Excalidraw fullscreen canvas — the panels live inside it as embeddable nodes       |
| Code editor | OpenVSCode Server on localhost:8080, embedded as an Excalidraw node                |
| Terminal    | PTY managed by `node-pty` (Electron main process), rendered via xterm.js as a node |

---

## Tech stack

| Layer         | Choice                        | Reason                                                            |
| ------------- | ----------------------------- | ----------------------------------------------------------------- |
| Desktop shell | Electron                      | Node.js only — `npm install && npm run dev`, zero extra toolchain |
| Backend       | Node.js (Electron main)       | Handles PTY (`node-pty`) and process spawning (`child_process`)   |
| Frontend      | React + TypeScript            | Familiar, component-based                                         |
| Whiteboard    | Excalidraw                    | Open source, embeddable, same approach as pad.ws                  |
| Editor        | OpenVSCode Server (Gitpod)    | Full VS Code experience, stable embeddable API, bundled with app  |
| Panels        | Excalidraw `renderEmbeddable` | Editor and terminal are nodes in the canvas, like pad.ws          |
| Bundler       | electron-vite                 | Vite for renderer, Electron-aware, fast HMR                       |

---

## What we explicitly ruled out

- ❌ Authentication (Keycloak or anything else) — single user, local machine
- ❌ Database (PostgreSQL or anything else) — JSON files for persistence
- ❌ Cloud / remote server — zero infra cost is a hard requirement
- ❌ Multi-tenant — one instance per developer, for that developer only
- ❌ code-server — requires a separate installation; OpenVSCode Server is bundled as an npm dependency
- ❌ Monaco Editor — pad.ws used this; no extension support, not suitable for a daily driver
- ❌ allotment — replaced by Excalidraw's native embeddable system
- ❌ "Open in VS Code" button — breaks the single-window experience, defeats the purpose

---

## Key behaviors

- On app launch: Electron main starts an OpenVSCode Server instance on port 8080 and opens a PTY via `node-pty`
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
