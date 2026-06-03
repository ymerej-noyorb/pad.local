Propose a gitmoji commit message based on staged changes.

Run `git diff --cached` and `git diff --cached --name-only` to analyze what is staged. If nothing is staged, run `git diff --name-only HEAD` and `git diff HEAD` to analyze all uncommitted changes instead — and tell the user to stage files before committing.

The gitmoji format rules and complete emoji list are in `.claude/rules/gitmoji.md`.

## Output

Propose **one primary message** and at most one alternative if the change is genuinely ambiguous. Do not list multiple options — make a recommendation.

Then show the exact command the user can run:

```
git commit -m "<emoji> <message>"
```

Do not run `git commit` yourself — the user writes all commits.
