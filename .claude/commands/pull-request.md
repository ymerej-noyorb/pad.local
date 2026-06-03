Generate a pull request title and description based on the current branch changes.

Run the following to understand what the PR contains:

- `git log main..HEAD --oneline` — commits on this branch
- `git diff main...HEAD --name-only` — files changed
- `git diff main...HEAD` — full diff

The gitmoji format rules and complete emoji list are in `.claude/rules/gitmoji.md`.

---

## PR description

Fill in the existing template from `.github/pull_request_template.md`:

```markdown
## What does this PR do?

<!-- One or two sentences. -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Docs

## Checklist

- [ ] `npm run format:check` passes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] Tested manually on my machine
```

Rules for filling it:

- **What does this PR do?** — one or two sentences, plain language, no jargon. Describe the user-visible change, not the implementation.
- **Type of change** — check all that apply with `[x]`
- **Checklist** — leave all items unchecked `[ ]` — the author verifies these manually before merging. Note: CI runs `format:check`, `lint`, and `typecheck` in that order, then if all pass it builds the app on Linux, Windows, and macOS — all are blocking on every PR targeting `main`.

---

## Output

Show the filled title and description, then the ready-to-run command:

```
gh pr create --title "<emoji> <title>" --body "$(cat <<'EOF'
<filled description>
EOF
)"
```

Do not run `gh pr create` yourself — the user decides when to open the PR.
