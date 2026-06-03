# Architecture decisions

## IDE support scope

The Editor panel embeds an IDE via `<webview src="http://localhost:PORT">`. This requires the IDE to expose a local HTTP server serving a full web UI — a capability specific to VS Code and its forks.

**Supported (or trivially supportable):**

- VS Code — the default, uses `code serve-web`
- Cursor — VS Code fork, inherits `serve-web`; only binary detection differs
- Windsurf — VS Code fork, same as Cursor
- VSCodium — VS Code fork, same as Cursor

**Not supported:**

- Terminal-based editors (Neovim, Vim, Helix, Emacs…) — already usable via the Terminal panel; no dedicated Editor node needed
- JetBrains IDEs, Zed, and any other desktop IDE without a `serve-web` equivalent — see ruled out below

## What we explicitly ruled out

- ❌ Test suite (unit, integration, e2e) — no test infrastructure exists and none is planned; do not suggest adding tests or test frameworks

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
