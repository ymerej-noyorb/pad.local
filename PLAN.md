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

|                  | pad.ws                    | pad.local                                                          |
| ---------------- | ------------------------- | ------------------------------------------------------------------ |
| Editor           | Monaco (no extensions)    | VS Code `serve-web` (built-in, uses `--server-data-dir ~/.vscode`) |
| Terminal         | iframe → remote workspace | xterm.js + node-pty local                                          |
| Persistence      | Cloud                     | Local JSON (Node.js fs)                                            |
| Embeddable types | 7                         | 2 (`Editor`, `Terminal`)                                           |

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

## Step 3 — Terminal (xterm.js + node-pty) ✅

- [x] Install `@xterm/xterm`, `@xterm/addon-fit`, `node-pty`
- [x] `Terminal.tsx`: xterm.js with adaptive resize
- [x] Main: spawn PTY via `node-pty`, bidirectional IPC (stdin ↔ PTY ↔ renderer)
- [x] Multiple instances via UUID per node (`element.id` used directly as session key)
- [x] Wired to `Terminal` in `renderEmbeddable`

**Notes:**

- PTY session lifecycle is tied to the Excalidraw element, not the React component. The component connects to an existing session on remount (React StrictMode) without re-spawning. `killAllTerminals()` cleans up on app close.
- On Windows, killing a PTY via ConPTY propagates a `STATUS_CONTROL_C_EXIT` signal to any PTY spawned shortly after in the same console group. Decoupling the PTY lifecycle from the component unmount avoids this race.
- Terminal color theme: native (no override). Each shell renders with its own default palette — intentional, preserves per-shell aesthetic.

**Files:** `src/renderer/src/components/Terminal.tsx`, `src/main/pty.ts`, `src/main/ipc.ts`, `src/preload/index.ts`, `src/preload/index.d.ts`, `src/renderer/src/theme.ts`

---

## Step 4 — Agnostic node system (any IDE, any shell) ✅

Goal: Editor and Terminal nodes are no longer hardcoded to a single VS Code instance and a fixed shell. Each spawn is independent — the user picks the editor type and shell at the moment they add a node to the canvas.

Approach chosen: **per-spawn picker** (not a global config/settings panel). Clicking "Add Editor" or "Add Terminal" opens a popover listing detected options on the current machine.

### What was implemented

**Editor side:**

- [x] `src/shared/types.ts`: shared `EditorType`, `EditorInfo`, `ShellInfo` types
- [x] `src/main/editorDetect.ts`: detects installed VS Code forks via known binary paths + `where`/`which` fallback
- [x] `src/main/editor.ts`: singleton → `Map<EditorType, EditorSession>`; each session has its own port and `serve-web` process, spawned on first use
- [x] `src/main/editorState.ts`: `editor-url.txt` → `editor-urls.json` keyed by `EditorType`
- [x] `src/main/constants.ts`: `VSCODE_PORT` → `EDITOR_BASE_PORT` + `EDITOR_PORTS` record
- [x] `src/main/window.ts`: URL allow-list covers all 4 editor ports

**Supported editor types:**

| Type       | Binary                | Port | Notes                               |
| ---------- | --------------------- | ---- | ----------------------------------- |
| `vscode`   | `code` / `code.cmd`   | 8080 | Default                             |
| `cursor`   | `cursor`              | 8081 | VS Code fork — inherits `serve-web` |
| `windsurf` | `windsurf`            | 8082 | VS Code fork — inherits `serve-web` |
| `vscodium` | `codium` / `vscodium` | 8083 | VS Code fork — inherits `serve-web` |

All four use identical `serve-web` args. Only binary detection and settings dir differ.

**Terminal side:**

- [x] `src/main/shellDetect.ts`: Unix reads `/etc/shells`; Windows checks known paths for PowerShell 7, Windows PowerShell, cmd.exe, Git Bash
- [x] `src/main/pty.ts`: removed hardcoded default shell; shell is always provided by the caller

**IPC:**

- [x] `editor:detect` — returns detected editors list
- [x] `editor:start` — starts an editor server on demand (type param)
- [x] `editor:ready?` / `editor:error?` / `editor:port` — per-type status queries
- [x] `editor:url:load` / `editor:url:save` — persisted URL per type
- [x] `shell:detect` — returns detected shells list
- [x] `terminal:spawn` now takes `shell` as second param

**Renderer:**

- [x] `src/renderer/src/components/Picker.tsx`: generic popover anchored to button right edge; uses Excalidraw CSS variables (`--island-bg-color`, `--shadow-island`, `--button-hover-bg`, `--text-primary-color`, `--ui-font`)
- [x] `src/renderer/src/components/Toolbar.tsx`: detects editors/shells on mount, shows `Picker` on button click; passes `{editorType}` or `{shell}` into `customData` via `createEmbeddableElement`
- [x] `src/renderer/src/lib/createEmbeddable.ts`: `typeData: Record<string, string>` param spread into `customData`
- [x] `src/renderer/src/components/Editor.tsx`: `editorType` prop; calls `startEditor(editorType)` on mount; dynamic error messages per editor
- [x] `src/renderer/src/components/Terminal.tsx`: `shell` prop passed to `terminalSpawn`
- [x] `src/renderer/src/App.tsx`: reads `element.customData.editorType` / `element.customData.shell` and passes to respective components

**Files:** `src/shared/types.ts`, `src/main/constants.ts`, `src/main/editor.ts`, `src/main/editorDetect.ts`, `src/main/editorState.ts`, `src/main/pty.ts`, `src/main/shellDetect.ts`, `src/main/ipc.ts`, `src/main/window.ts`, `src/main/index.ts`, `src/preload/index.ts`, `src/preload/index.d.ts`, `src/renderer/src/components/Picker.tsx`, `src/renderer/src/components/Toolbar.tsx`, `src/renderer/src/components/Editor.tsx`, `src/renderer/src/components/Terminal.tsx`, `src/renderer/src/lib/createEmbeddable.ts`, `src/renderer/src/App.tsx`

---

## Verification

1. `npm install && npm run dev` works with Node.js + VS Code as the only prerequisites (macOS, Windows, Linux)
2. Excalidraw fullscreen (dark, grid), scene persisted across restarts
3. Panning the canvas → embeddables no longer capture mouse events
4. "Add Editor" → picker lists detected VS Code forks → node in the canvas → editor loaded with their extensions
5. "Add Terminal" → picker lists detected shells → node in the canvas → functional shell terminal
6. Multiple editors of different types can coexist in the canvas (each on its own port)
7. Multiple terminals with different shells can coexist in the canvas
8. Editor server starts on first use (not at app launch)
