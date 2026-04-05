# pad.local — Development Plan

## Architecture

Excalidraw as the main canvas. The editor and terminal are **Excalidraw nodes** rendered via `renderEmbeddable` — same approach as pad.ws, simplified to 2 types.

```
src/renderer/  (React + TypeScript)
└── <Excalidraw
      renderEmbeddable={(element) => {
        "!editor"   → <Editor />   (iframe → localhost:8080)
        "!terminal" → <Terminal /> (xterm.js ↔ IPC ↔ main)
      }}
      onScrollChange={lockEmbeddables}
      validateEmbeddable={true}
    />
    └── Toolbar ("Add Editor" / "Add Terminal" buttons)

src/main/  (Node.js — Electron main process)
├── spawn `code serve-web --port 8080 --without-connection-token`
├── node-pty → PTY shell
└── IPC handlers (terminal stdin/stdout ↔ renderer)
```

### Differences from pad.ws

| | pad.ws | pad.local |
|---|---|---|
| Editor | Monaco (no extensions) | `code serve-web` (user's VS Code, extensions included) |
| Terminal | iframe → remote workspace | xterm.js + node-pty local |
| Persistence | Cloud | Local JSON (Node.js fs) |
| Embeddable types | 7 | 2 (`!editor`, `!terminal`) |

### What we take from pad.ws

- `renderEmbeddable` + `validateEmbeddable`
- Lock mechanism: `onScrollChange` → `pointer-events: none` on embeddables during pan (debounce 350ms)
- Initial Excalidraw config: `theme: dark`, `gridModeEnabled: true`
- Native UI kept (toolbar, zoom, undo/redo, help, main menu) — disabled canvas actions: `changeViewBackgroundColor`, `clearCanvas`, `loadScene`, `saveToActiveFile`, `toggleTheme`
- New nodes placed at viewport center, with overlap avoidance

---

## Step 1 — Excalidraw + renderEmbeddable skeleton ✅

- [x] Install `@excalidraw/excalidraw`
- [x] `renderer/App.tsx`: fullscreen Excalidraw with initial config (dark, grid)
- [x] `renderEmbeddable`: `!editor` → placeholder, `!terminal` → placeholder
- [x] `onScrollChange` → lock/unlock `pointer-events` (debounce 350ms)
- [x] `Toolbar.tsx`: 2 buttons that create a node at viewport center
- [x] Scene persistence → local JSON via Node.js `fs` (IPC main ↔ renderer)
- [x] Load scene on startup

**Files:** `src/renderer/src/App.tsx`, `src/renderer/src/components/Toolbar.tsx`, `src/renderer/src/lib/lockEmbeddables.ts`, `src/renderer/src/lib/createEmbeddable.ts`, `src/renderer/src/hooks/useScene.ts`, `src/main/scene.ts`, `src/main/ipc.ts`

---

## Step 2 — Editor (`code serve-web` iframe)

- [ ] On startup: `child_process.spawn('code', ['serve-web', '--port', '8080', '--without-connection-token'])`
- [ ] Kill process on app close (`app.on('before-quit')`)
- [ ] `Editor.tsx`: `<iframe src="http://localhost:8080">` with loading state
- [ ] Wired to `!editor` in `renderEmbeddable`

**Files:** `src/renderer/components/Editor.tsx`, `src/main/index.ts`

---

## Step 3 — Terminal (xterm.js + node-pty)

- [ ] Install `@xterm/xterm`, `@xterm/addon-fit`, `node-pty`
- [ ] `Terminal.tsx`: xterm.js with adaptive resize
- [ ] Main: spawn PTY via `node-pty`, bidirectional IPC (stdin ↔ PTY ↔ renderer)
- [ ] Multiple instances via UUID per node (stored in `element.customData`)
- [ ] Wired to `!terminal` in `renderEmbeddable`

**Files:** `src/renderer/components/Terminal.tsx`, `src/main/pty.ts`

---

## Verification

1. `npm install && npm run dev` works with Node.js as the only prerequisite
2. Excalidraw fullscreen (dark, grid), scene persisted across restarts
3. Panning the canvas → embeddables no longer capture mouse events
4. "Add Editor" → node in the canvas → user's VS Code loaded with their extensions
5. "Add Terminal" → node in the canvas → functional shell terminal
6. Multiple terminals can coexist in the canvas
