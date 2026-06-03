Add a new AI provider to pad.local's AI panel.

**Provider:** $ARGUMENTS

---

Adding a provider touches exactly 2 files. Apply all code conventions throughout (semicolons, SCREAMING_SNAKE_CASE, explicit names).

---

## Step 1 — Clarify before writing any code

Ask the user:

1. What is the provider's unique ID? (lowercase, no spaces — becomes the `AiProvider` union member and the session `partition` key)
2. What is the display label shown in the picker?
3. What is the URL to embed? (the chat/app URL, not the marketing page)

Wait for answers before proceeding.

---

## Step 2 — `src/shared/types.ts`

Add the new provider ID to the `AiProvider` union type.

---

## Step 3 — `src/shared/aiProviders.ts`

Add a new entry to the `AI_PROVIDERS` array:

```ts
{ id: "<id>", label: "<Label>", url: "<url>" }
```

The array is typed `as const satisfies AiProviderInfo[]` — the TypeScript compiler will catch any mismatch with the `AiProvider` union automatically.

---

## Step 4 — Verify

- `AiProvider` union in `src/shared/types.ts` includes the new ID
- `AI_PROVIDERS` in `src/shared/aiProviders.ts` has the new entry
- The new provider's session will be automatically isolated via `partition="persist:ai-<id>"` — no extra code needed
- Run `npm run typecheck` to confirm no type errors
