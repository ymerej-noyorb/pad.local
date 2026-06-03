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

## Security invariants

These settings are fixed. Never suggest changing them, even as a "quick fix" for a dev issue.

| Setting            | Value                          | Why it must not change                                                                                               |
| ------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `nodeIntegration`  | `false` (Electron default)     | Enabling it gives any loaded page direct access to Node.js — instant RCE if a webview loads external content         |
| `webSecurity`      | enabled (never set to `false`) | Disabling it bypasses the same-origin policy entirely — commonly suggested for CORS issues, catastrophic in Electron |
| `contextIsolation` | `true`                         | Already documented above — mandatory when `sandbox: false`                                                           |

**`sandbox: false`** is set intentionally in `window.ts` — it is required for the preload script to access native Node modules (`node-pty`, `child_process`). Do not "fix" it. Because sandbox is off, `contextIsolation: true` becomes even more critical as the only barrier between renderer code and Node.js.

**`shell: true` in `child_process`** — never use it when any part of the command string comes from IPC or user input. It passes the command through the OS shell interpreter, enabling command injection. All `spawn()` and `execSync()` calls in this codebase use hardcoded binary paths and argument arrays — keep it that way.

## `partition` — session isolation

Each `<webview>` partition creates an isolated cookie/storage session:

- `"persist:browser"` — shared across all Browser nodes (intentional: one login = all nodes)
- `` `persist:ai-${providerId}` `` — one session per AI provider (logging into Claude does not affect ChatGPT)
- No partition on Editor webviews (default session, no login needed)

Never reuse a partition key across unrelated features — it merges their cookies and storage.
