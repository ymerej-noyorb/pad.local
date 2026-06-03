Scaffold a new Excalidraw embeddable panel node for pad.local.

**Node name:** $ARGUMENTS

---

Follow these steps exactly, in order. Apply all code conventions from `.claude/rules/code-conventions.md` throughout (semicolons, TEXT constant, theme.ts colors, SCREAMING_SNAKE_CASE constants, explicit names).

---

## Step 1 — Clarify before writing any code

Ask the user:
1. Does this node need to communicate with the Electron main process (IPC)? If yes, what operations?
2. Is it a `<webview>` embedding an external URL, or a pure React UI rendered directly in the canvas?
3. What custom data should be stored in `element.customData` (e.g., a URL, a provider ID, a shell path)?
4. What default size should the node have (width × height in pixels)?

Wait for answers before proceeding.

---

## Step 2 — Type definition

**File:** `src/renderer/src/types/embeddable.ts`

Add the new type (lowercase kebab-case) to the `EmbeddableType` union.

---

## Step 3 — Panel component

**File:** `src/renderer/src/components/<Name>/<Name>Panel.tsx`

Create the component following the pattern of the simplest existing panel that matches the node type:
- Webview-based → use `AiPanel` (`src/renderer/src/components/AI/AiPanel.tsx`) as reference
- Webview with UI controls → use `BrowserPanel` (`src/renderer/src/components/Browser/BrowserPanel.tsx`) as reference
- Pure React UI → create a plain component

Required in every panel component:
- `TEXT` constant at the top grouping all user-visible strings
- Colors imported from `src/renderer/src/theme.ts` via `colorsByTheme[theme]`, never hardcoded
- Named constants in SCREAMING_SNAKE_CASE for every numeric value
- Props: always include `theme: "dark" | "light"` and `scrollLocked: boolean`
- If it embeds a webview: call `patchWebviewIframeHeight()` on `dom-ready`, inject `FULLSCREEN_INJECT_SCRIPT`, use `registerFullscreenListeners()` — all from `src/renderer/src/lib/`
- Callbacks to propagate state changes back to the canvas (e.g., `onUpdate`) so `customData` stays in sync

---

## Step 4 — IPC layer (only if Step 1 answer was yes)

**Main process logic:** `src/main/<feature>/index.ts`  
Implement the actual feature logic here. Follow the pattern of `src/main/terminal/index.ts` or `src/main/editor/index.ts`.

**IPC handlers:** `src/main/ipc.ts`  
Register handlers with `ipcMain.handle()` (request-response) or `ipcMain.on()` (fire-and-forget). Follow existing handler registrations in `registerIpcHandlers()`.

**Preload bridge:** `src/preload/index.ts` and `src/preload/index.d.ts`  
Expose methods via `contextBridge.exposeInMainWorld("api", { ... })`. For event listeners, return an unsubscribe function. Add corresponding type definitions to the `Window["api"]` interface in `index.d.ts`.

---

## Step 5 — Toolbar button

**File:** `src/renderer/src/components/Toolbar/Toolbar.tsx`

- Add a toolbar button with an appropriate icon from the existing icon set already used in the file
- If the node needs configuration before creation (e.g., pick a provider, enter a URL): add a `<Picker>` dropdown following the pattern of the editor or AI picker
- If no configuration is needed: call `createEmbeddableElement()` and `excalidrawAPI.updateScene()` directly on click
- Wire the handler with `createEmbeddableElement("your-type", { ...customData }, scrollX, scrollY, zoom.value, existingElements)`

---

## Step 6 — App registration

**File:** `src/renderer/src/App.tsx`

1. Add a `const EMBEDDABLE_TYPE_<NAME> = "your-type"` constant near the other `EMBEDDABLE_TYPE_*` constants at the top of the file
2. Add a case in the `renderEmbeddable` callback that reads `element.customData` and renders `<NamePanel ... />`; wire `onUpdate` callbacks to `activeExcalidrawAPI?.updateScene()` following the pattern of existing cases
3. Add the new type to `validateEmbeddable`

---

## Step 7 — Verify

After writing all files:
- Confirm there are no hardcoded color values (all from `theme.ts`)
- Confirm there are no inline user-visible strings (all in `TEXT`)
- Confirm there are no magic numbers (all in named constants)
- Confirm there are no abbreviations in identifiers
- Confirm all statements end with semicolons
