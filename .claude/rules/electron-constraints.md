# Electron constraints

## Content Security Policy (CSP)

The Electron renderer process enforces a strict CSP. **Do not suggest any solution that loads resources from external URLs at runtime** — they will be silently blocked.

Concretely blocked:
- Fetching icons or assets from a CDN (e.g. `api.iconify.design`, Google Fonts, jsDelivr)
- `fetch()` / `XMLHttpRequest` to any external API from renderer code
- Dynamically injected `<script src="https://...">` or `<link href="https://...">`

This is a hard constraint, not a configuration choice. The workaround is always to bundle the asset at build time or inline it as a string/SVG.

**Real example:** Iconify was evaluated and abandoned because its runtime SVG fetching (`api.iconify.design`) is blocked by CSP. Icons are now inlined as SVG strings directly in the component files.

## Context isolation

`contextIsolation: true` is enforced for all BrowserWindows and webviews. This means:
- Renderer code has **no direct access to Node.js APIs** (`fs`, `path`, `child_process`, etc.)
- The only bridge between renderer and main process is the `window.api` object exposed via `contextBridge` in `src/preload/index.ts`
- Never suggest importing Node.js modules in renderer code — route through IPC instead

## `<webview>` vs `<iframe>`

Panels use Electron's `<webview>` tag, not standard `<iframe>`. Key differences:
- `<webview>` runs in a separate renderer process with its own session
- Events are Electron-specific: `dom-ready`, `did-navigate`, `did-navigate-in-page`, `enter-html-full-screen`, etc.
- Methods are Electron-specific: `executeJavaScript()`, `send()`, `.shadowRoot.querySelector("iframe")` for height patching
- Standard `<iframe>` sandbox attributes and `postMessage` patterns do not apply

## `partition` — session isolation

Each `<webview>` partition creates an isolated cookie/storage session:
- `"persist:browser"` — shared across all Browser nodes (intentional: one login = all nodes)
- `` `persist:ai-${providerId}` `` — one session per AI provider (logging into Claude does not affect ChatGPT)
- No partition on Editor webviews (default session, no login needed)

Never reuse a partition key across unrelated features — it merges their cookies and storage.
