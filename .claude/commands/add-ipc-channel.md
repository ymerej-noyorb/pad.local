Add a standalone IPC channel to pad.local — without creating a new panel node.

**Channel:** $ARGUMENTS

---

Use this command when you need to expose a new main-process capability to the renderer, but are not scaffolding a full new panel. Follow all code conventions from `.claude/rules/code-conventions.md` throughout (semicolons, SCREAMING_SNAKE_CASE, explicit names).

---

## Step 1 — Clarify before writing any code

Ask the user:

1. What does this channel do? (one sentence)
2. Is it request-response (`ipcMain.handle` / `ipcRenderer.invoke`) or fire-and-forget (`ipcMain.on` / `ipcRenderer.send`)?
3. Does the main process need to push events back to the renderer? If yes, what triggers the push?
4. What arguments does the renderer send, and what does the main process return (if anything)?

Wait for answers before proceeding.

---

## Step 2 — Main-process logic

**File:** `src/main/<feature>/index.ts`

Implement the actual logic here. Follow the pattern of `src/main/terminal/index.ts` or `src/main/editor/index.ts`:

- Export named functions, no default exports
- Keep IPC wiring out of this file — only business logic

---

## Step 3 — IPC handler

**File:** `src/main/ipc.ts` — inside `registerIpcHandlers()`

- Request-response: `ipcMain.handle("channel:name", (_event, ...args) => { ... })`
- Fire-and-forget: `ipcMain.on("channel:name", (_event, ...args) => { ... })`
- Main → renderer push: `BrowserWindow.getAllWindows().forEach(w => w.webContents.send("channel:name", payload))`

Channel name convention: `"feature:action"` (e.g. `"terminal:spawn"`, `"editor:start"`).

---

## Step 4 — Preload bridge

**File:** `src/preload/index.ts` — inside `contextBridge.exposeInMainWorld("api", { ... })`

- Wrap `ipcRenderer.invoke` / `ipcRenderer.send` in a typed function
- For renderer listeners (main → renderer push): return an unsubscribe function
  ```ts
  onSomeEvent: (handler) => {
    ipcRenderer.on("channel:name", (_event, payload) => handler(payload));
    return () => ipcRenderer.removeAllListeners("channel:name");
  };
  ```

---

## Step 5 — Type definition

**File:** `src/preload/index.d.ts` — inside the `Window["api"]` interface

Add the typed signature for every function exposed in Step 4.

---

## Step 6 — Verify

- Run `npm run typecheck` to confirm no type errors
- Tell the user the exact `window.api.xxx()` call the renderer needs to make
