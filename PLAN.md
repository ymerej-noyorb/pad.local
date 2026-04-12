# pad.local — Development Plan

## Architecture

Excalidraw as the main canvas. The editor and terminal are **Excalidraw nodes** rendered via `renderEmbeddable` — same approach as pad.ws, simplified to 2 types.

```
src/renderer/  (React + TypeScript)
└── <Excalidraw
      renderEmbeddable={(element) => {
        "Editor"   → <Editor />   (webview → localhost:8080)
        "Terminal" → <Terminal /> (xterm.js ↔ IPC ↔ main)
      }}
      onScrollChange={lockEmbeddables}
      validateEmbeddable={true}
    />
    └── Toolbar ("Add Editor" / "Add Terminal" buttons)

src/main/  (Node.js — Electron main process)
├── spawn `code serve-web` on port 8080
├── node-pty → PTY shell
└── IPC handlers (terminal stdin/stdout ↔ renderer)
```

### Differences from pad.ws

| | pad.ws | pad.local |
|---|---|---|
| Editor | Monaco (no extensions) | VS Code `serve-web` (built-in, uses `--server-data-dir ~/.vscode`) |
| Terminal | iframe → remote workspace | xterm.js + node-pty local |
| Persistence | Cloud | Local JSON (Node.js fs) |
| Embeddable types | 7 | 2 (`Editor`, `Terminal`) |

### What we take from pad.ws

- `renderEmbeddable` + `validateEmbeddable`
- Lock mechanism: `onScrollChange` → `pointer-events: none` on embeddables during pan (debounce 350ms)
- Initial Excalidraw config: `theme: dark`, `gridModeEnabled: true`
- Native UI kept (toolbar, zoom, undo/redo, help, main menu) — disabled canvas actions: `changeViewBackgroundColor`, `clearCanvas`, `loadScene`, `saveToActiveFile`
- New nodes placed at viewport center, with overlap avoidance

---

## Step 1 — Excalidraw + renderEmbeddable skeleton ✅

- [x] Install `@excalidraw/excalidraw`
- [x] `renderer/App.tsx`: fullscreen Excalidraw with initial config (dark, grid)
- [x] `renderEmbeddable`: `Editor` → placeholder, `Terminal` → placeholder
- [x] `onScrollChange` → lock/unlock `pointer-events` (debounce 350ms)
- [x] `Toolbar.tsx`: 2 buttons that create a node at viewport center
- [x] Scene persistence → local JSON via Node.js `fs` (IPC main ↔ renderer)
- [x] Load scene on startup

**Files:** `src/renderer/src/App.tsx`, `src/renderer/src/components/Toolbar.tsx`, `src/renderer/src/lib/lockEmbeddables.ts`, `src/renderer/src/lib/createEmbeddable.ts`, `src/renderer/src/hooks/useScene.ts`, `src/main/scene.ts`, `src/main/ipc.ts`

---

## Known limitations

- **Export image + embedded panels** — Excalidraw exports via `<canvas>` (PNG) or SVG. Browsers block drawing iframe content onto a canvas (tainted canvas security restriction), even same-origin. The Editor and Terminal panels will appear as empty frames in exports. Annotations, shapes, and layout are captured correctly.
- **WSL not supported** — VS Code's CLI in WSL is a remote wrapper that does not expose `serve-web`. macOS, Windows, and Linux (native) only.

---

## Step 2 — Editor (VS Code serve-web) ✅

- [x] On startup: spawn `code serve-web --port 8080 --without-connection-token --accept-server-license-terms` via `child_process.spawn`
- [x] Detect the `code` binary per platform (macOS, Windows, Linux)
- [x] Kill process on app close (`app.on('before-quit')`)
- [x] `Editor.tsx`: `<webview src="http://localhost:8080">` with loading state
- [x] Wired to `Editor` in `renderEmbeddable`

**Prerequisite:** VS Code installed on the machine (macOS, Windows, Linux — WSL unsupported).

**Notes:**
- `<webview>` (not `<iframe>`) — VS Code registers service workers that require an isolated renderer process
- `forceEnglishLocale()` in `window.ts` — prevents VS Code from loading a broken French NLS script from an external CDN
- `allowVSCodeEmbedding()` in `window.ts` — strips `X-Frame-Options` and `Content-Security-Policy` headers that block embedding
- Shadow-root iframe fix in `Editor.tsx` — Electron's webview creates an internal `<iframe>` with no height; patched via `shadowRoot.querySelector('iframe').style.height = '100%'` after `dom-ready`

**Files:** `src/main/constants.ts`, `src/main/editor.ts`, `src/main/editorState.ts`, `src/main/index.ts`, `src/main/ipc.ts`, `src/main/window.ts`, `src/preload/index.ts`, `src/preload/index.d.ts`, `src/renderer/index.html`, `src/renderer/src/env.d.ts`, `src/renderer/src/App.tsx`, `src/renderer/src/components/Editor.tsx`

---

## Step 3 — Terminal (xterm.js + node-pty)

- [ ] Install `@xterm/xterm`, `@xterm/addon-fit`, `node-pty`
- [ ] `Terminal.tsx`: xterm.js with adaptive resize
- [ ] Main: spawn PTY via `node-pty`, bidirectional IPC (stdin ↔ PTY ↔ renderer)
- [ ] Multiple instances via UUID per node (stored in `element.customData`)
- [ ] Wired to `Terminal` in `renderEmbeddable`

**Files:** `src/renderer/components/Terminal.tsx`, `src/main/pty.ts`

---

## Step 4 — Agnostic node system (any IDE, any shell)

Goal: nodes are no longer hardcoded to VS Code `serve-web` and node-pty. The user can configure which editor and which shell to use. The architecture stays the same — only the spawn target changes.

### 4.1 — User configuration

- [ ] `src/main/config.ts`: read/write a local JSON config file (`~/.pad.local/config.json`)
- [ ] Config shape:
  ```json
  {
    "editor": { "type": "vscode-serve-web", "port": 8080 },
    "terminal": { "shell": "/bin/zsh" }
  }
  ```
- [ ] IPC handlers: renderer can read and write config
- [ ] Defaults: VS Code `serve-web` + system shell (`process.env.SHELL` or `cmd.exe` on Windows)
- [ ] Port conflict handling: if the configured port is already in use, auto-select the next available port and persist it to config (`EADDRINUSE` → retry on `port + 1`)
- [ ] `Settings.tsx`: settings panel accessible from the Excalidraw main menu
  - Dropdown to select the editor (list of supported types)
  - Dropdown to select the shell (detected shells on the system + manual input)
  - Changes apply on next node spawn (no restart required)

### 4.2 — Extensible spawn abstraction

- [ ] `src/main/editor.ts`: `startEditor(config)` — spawns the configured editor server and returns the URL to embed
- [ ] `src/main/pty.ts`: `spawnShell(config)` — uses `config.terminal.shell` instead of hardcoded shell
- [ ] Editor node in canvas embeds the URL returned by `startEditor` — not a hardcoded `localhost:8080`

### 4.3 — Extensible node types

- [ ] Replace hardcoded `Editor` / `Terminal` strings with a node type registry
- [ ] Registry maps a node type key → `{ label, icon, defaultSize, component }`
- [ ] `Toolbar.tsx` reads the registry to render buttons dynamically
- [ ] `renderEmbeddable` resolves node type from registry instead of a switch/if chain

**Files:** `src/main/config.ts`, `src/main/editor.ts`, `src/main/pty.ts`, `src/renderer/src/lib/nodeRegistry.ts`, `src/renderer/src/components/Toolbar.tsx`, `src/renderer/src/App.tsx`

---

## Verification

1. `npm install && npm run dev` works with Node.js + VS Code as the only prerequisites (macOS, Windows, Linux)
2. Excalidraw fullscreen (dark, grid), scene persisted across restarts
3. Panning the canvas → embeddables no longer capture mouse events
4. "Add Editor" → node in the canvas → VS Code loaded with their extensions
5. "Add Terminal" → node in the canvas → functional shell terminal
6. Multiple terminals can coexist in the canvas
7. Changing `config.json` shell → terminal uses the new shell on next spawn
8. Adding a new entry to the node registry → new button appears in toolbar automatically
