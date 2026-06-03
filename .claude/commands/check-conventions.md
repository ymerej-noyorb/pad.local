Audit one or more files for pad.local code convention violations.

**Target:** $ARGUMENTS (file path, directory, or glob — defaults to the entire `src/` tree if omitted)

---

Read every targeted file and report violations grouped by category. For each violation, output the file path, line number, and a one-line fix description. Do not auto-fix — report only.

## Conventions to check

### 1. Hardcoded colors
Any color value written inline (hex `#rrggbb`, `rgb(...)`, `hsl(...)`, CSS color name) instead of a token imported from `src/renderer/src/theme.ts`.  
**Flag:** every occurrence that is not `colorsByTheme[theme].someToken`.

### 2. Inline user-visible strings
Any string literal that will be displayed to the user (button labels, tooltips, placeholders, error messages, aria-labels) that is not referenced via a `TEXT.key` constant.  
**Flag:** string literals in JSX text content, `title`, `placeholder`, `aria-label`, `alt` props that are not `TEXT.*` references. Ignore strings that are never shown to the user (IPC channel names, CSS class names, `partition` values, URLs, etc.).

### 3. Missing TEXT constant
A file that contains user-visible strings (as identified above) but has no `TEXT` constant declared at the top.  
**Flag:** the file itself.

### 4. Magic numbers
Numeric literals used inline for layout, timing, sizing, or behavior — anything that is not `0`, `1`, `-1`, `100` (percentage), or an obvious index.  
**Flag:** every inline number that should be a named `SCREAMING_SNAKE_CASE` constant.

### 5. Identifier abbreviations
Single-letter variables (`i`, `j`, `k`, `e`, `n`), common abbreviations (`el`, `err`, `cb`, `fn`, `ref`, `ctx`, `evt`, `evt`, `msg`, `res`, `req`, `cfg`, `opts`, `val`, `idx`, `len`, `num`, `str`, `obj`, `arr`, `tmp`, `buf`), or any other shortened name where a full word is clearly intended.  
**Flag:** every abbreviated identifier in variable declarations, parameters, and destructuring. Ignore single-letter generic type parameters (`T`, `K`, `V`) — those are idiomatic TypeScript.

### 6. Missing semicolons
Any statement that does not end with a semicolon where one is required (Prettier enforces this, but flag it if found).

---

## Output format

Group findings by category. If a category has no violations, skip it entirely. Example:

```
### Hardcoded colors
- src/renderer/src/components/Foo/FooPanel.tsx:42 — replace "#1e1e2e" with colorsByTheme[theme].base

### Magic numbers
- src/renderer/src/components/Foo/FooPanel.tsx:18 — extract 800 into DEFAULT_WIDTH
- src/renderer/src/components/Foo/FooPanel.tsx:19 — extract 500 into DEFAULT_HEIGHT

### Identifier abbreviations
- src/renderer/src/components/Foo/FooPanel.tsx:67 — rename `el` to `element`
```

End with a one-line summary: total violation count and files affected.
