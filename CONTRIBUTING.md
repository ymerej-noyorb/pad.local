# Contributing to pad.local

Thanks for taking the time to contribute!

---

## 🔧 Prerequisites

- Node.js 20.19+ (24 LTS recommended)
- At least one of: VS Code, Cursor, Windsurf, or VSCodium

## ⚡ Setup

```bash
git clone https://github.com/ymerej-noyorb/pad.local
cd pad.local
npm install
npm run dev
```

---

## ✅ Before submitting a PR

Make sure these pass locally:

```bash
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # TypeScript
```

Auto-fix formatting with `npm run format`.

---

## 📐 Code conventions

These are enforced — PRs that don't follow them won't be merged.

- **Semicolons** — always, enforced by Prettier
- **TEXT constant** — every file with user-visible strings must declare a `const TEXT = { ... }` grouping all of them; never inline strings
- **Colors** — always import from `src/renderer/src/theme.ts` (Catppuccin Mocha tokens); never hardcode color values
- **Named constants** — no magic numbers inline; extract to `SCREAMING_SNAKE_CASE` constants at the top of the file
- **Readable names** — `element` not `el`, `index` not `i`, `error` not `err`
- **KISS** — don't add abstractions, error handling, or features beyond what the task requires

---

## 💬 Commit messages

This project uses [Gitmoji](https://gitmoji.dev) for commit messages. Pick the emoji that best matches your change — e.g. `✨ Add browser touch simulation`, `🐛 Fix terminal CWD not restoring`, `📝 Update README`.

---

## 🚀 Submitting a PR

1. Fork the repo and create a branch from `main` (`feature/...`, `fix/...`, `docs/...`, etc.)
2. Make your changes
3. Run the checks above
4. Open a PR targeting `main` — the template will guide you

---

## 🐛 Reporting a bug or requesting a feature

Use the [GitHub Issues](https://github.com/ymerej-noyorb/pad.local/issues) tab and pick the appropriate template.
