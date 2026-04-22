# Contributing to pad.local

Thanks for taking the time to contribute!

---

## Prerequisites

- Node.js v24 LTS
- At least one of: VS Code, Cursor, Windsurf, or VSCodium

## Setup

```bash
git clone https://github.com/ymerej-noyorb/pad.local
cd pad.local
npm install
npm run dev
```

---

## Before submitting a PR

Make sure these pass locally:

```bash
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # TypeScript
```

Auto-fix formatting with `npm run format`.

---

## Code conventions

These are enforced — PRs that don't follow them won't be merged.

- **Semicolons** — always, enforced by Prettier
- **TEXT constant** — every file with user-visible strings must declare a `const TEXT = { ... }` grouping all of them; never inline strings
- **Colors** — always import from `src/renderer/src/theme.ts` (Catppuccin Mocha tokens); never hardcode color values
- **Named constants** — no magic numbers inline; extract to `SCREAMING_SNAKE_CASE` constants at the top of the file
- **Readable names** — `element` not `el`, `index` not `i`, `error` not `err`
- **KISS** — don't add abstractions, error handling, or features beyond what the task requires

---

## Submitting a PR

1. Fork the repo and create a branch from `develop`
2. Make your changes
3. Run the checks above
4. Open a PR targeting `develop` — the template will guide you

---

## Reporting a bug or requesting a feature

Use the GitHub Issues tab and pick the appropriate template.
