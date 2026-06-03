# Architecture decisions

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
