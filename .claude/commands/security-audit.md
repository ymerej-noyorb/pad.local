Run a security audit on pad.local's Electron main process and IPC layer.

---

For each surface below, read the relevant source files and report findings as **OK**, **WARNING**, or **ISSUE** with a one-line explanation. At the end, output a summary table.

---

## 1. IPC input validation — `src/main/ipc.ts`

For every `ipcMain.handle` and `ipcMain.on` handler, check whether arguments received from the renderer are validated before being used in sensitive operations (file I/O, process spawn, shell execution, path construction).

Flag any handler that passes renderer-supplied data to a sensitive operation without validating it against an allowlist or schema.

## 2. Shell spawn — `src/main/terminal/`

Verify that `spawnTerminal` only accepts shell paths present in the list returned by `detectShells()`. The validation must happen in the IPC handler before calling `spawnTerminal`, not inside the function itself.

## 3. Path traversal — `src/main/storage.ts`

Verify that `readDataFile` and `deleteDataFile` call `isValidFileName` before constructing any file path. Verify that `isValidFileName` blocks `/`, `\`, and `..`. Verify that `importData` uses the stricter `isAllowedFileName` allowlist.

## 4. Child process — `src/main/editor/`

Check every `spawn()` and `execSync()` call:

- No `shell: true` option
- No user-controlled string interpolated into the command
- Arguments are arrays, not concatenated strings

## 5. `executeJavaScript` — `src/renderer/src/`

Find every `.executeJavaScript(...)` call. Verify that the injected script is a hardcoded string literal with no user-controlled data interpolated into it.

## 6. `shell.openExternal` — `src/main/`

Find every `shell.openExternal(...)` call. Verify each one is guarded by a URL scheme check (`/^https?:\/\//` or equivalent) before being called.

## 7. `dangerouslySetInnerHTML` — `src/renderer/src/`

Find every `dangerouslySetInnerHTML` usage. For each, verify the source of the HTML string is hardcoded (not user input, not IPC data, not external fetch).

## 8. Electron security settings — `src/main/window.ts`

Verify:

- `nodeIntegration` is not set to `true`
- `webSecurity` is not set to `false`
- `contextIsolation: true` is present
- `sandbox: false` is present (intentional — document if missing from the file)

## 9. Webview preloads — `src/renderer/src/`

Find every `<webview>` with a `preload` attribute. Verify the preload path comes from `window.api` (main process) and is not user-controllable.

---

## Output format

For each surface, one line per finding:

```
[OK]      Shell spawn — shell validated against detectShells() allowlist before spawnTerminal
[WARNING] executeJavaScript — EditorPanel interpolates element.customData.url into injected script
[ISSUE]   Path traversal — deleteDataFile missing isValidFileName check
```

End with a summary table:

| Surface              | Status       | Notes |
| -------------------- | ------------ | ----- |
| IPC input validation | ✅ / ⚠️ / ❌ | …     |
| Shell spawn          | …            | …     |
| …                    | …            | …     |

If everything is clean, say so explicitly. Do not invent findings — only report what you observe in the code.
