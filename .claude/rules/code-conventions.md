# Code conventions

- Always use semicolons at the end of statements (enforced by Prettier).
- Every file that contains user-visible text must declare a `TEXT` constant grouping all its strings. Strings are then referenced via `TEXT.key` — never inline.
- All colors are defined in `src/renderer/src/theme.ts` (Catppuccin Mocha tokens). Never hardcode color values inline — always import from `theme.ts`.
- No magic numbers inline — extract numeric values into named constants (`SCREAMING_SNAKE_CASE`).
- Constants used in a single file are declared at the top of that file. Only create a shared external file when a constant is used across multiple files.
- Code must be KISS and readable. Prefer explicit names over abbreviations: `element` not `el`, `index` not `i`, `error` not `err`, etc.
