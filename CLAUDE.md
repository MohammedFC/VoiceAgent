# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Out-of-hours call log and review dashboard for Jewel Home Support's voice agent ("Kath"), replacing an email-based call record system. Built from `Call-Log-App-Spec.md`. Stack: Next.js (App Router) + TypeScript + Supabase (Postgres + Auth) + Tailwind + shadcn/ui (base-ui, not Radix).

Two integrations are deliberately stubbed, not wired to real external services:
- **Email ingestion**: `POST /api/calls/ingest` accepts the existing 4-part email template shape (`callerName`, `phoneNumber`, `reasonOfCall`, `transcript`) but nothing polls the actual inbox yet.
- **Urgent SMS/voice alerting**: `src/lib/alerts/sendUrgentAlert.ts` only logs and is picked up by an in-app banner; no real provider (e.g. Twilio) is wired in. Keep its signature stable when touching it.

## Commands

```bash
npm run dev          # dev server
npm run build         # production build (also type-checks)
npm run typecheck     # tsc --noEmit
npm run lint           # eslint
npm run test           # vitest run -- flagging engine unit tests only
npm run test -- tests/flagging/agentLoopDetected.test.ts   # single test file
npm run migrate        # applies supabase/migrations/*.sql via SUPABASE_DB_URL (see below)
npm run seed            # inserts sample data via SUPABASE_SECRET_KEY, run through the real flagging engine
npm run seed -- --reset  # same, but truncates calls/review_flags/known_issues/agent_config_changes first
```

`npm run test` only covers `src/lib/flagging/` (pure TS, no DB dependency) -- there is no test coverage for Supabase-backed code paths (auth, RLS, triggers, Server Actions). Verify those manually against a real project.

## Environment variables (`.env.local`, gitignored)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` -- used by the running app (browser-safe).
- `SUPABASE_SECRET_KEY` -- server-only, bypasses RLS. Used by `scripts/seed.ts` and the `/api/calls/ingest` route (as a bearer token check). Never import `src/lib/supabase/admin.ts` from a Server Component or anything browser-reachable.
- `SUPABASE_DB_URL` -- only used by `npm run migrate`, never read by the app itself. If the password contains special characters (e.g. `@`), percent-encode them in the URL or the connection string parses wrong.

Supabase uses the newer publishable/secret key naming, not the legacy anon/service_role terminology -- keep that consistent if you add more env vars or docs.

## Architecture

### Data model and access control
Four tables, defined across `supabase/migrations/0001` through `0007`: `calls`, `review_flags`, `known_issues`, `agent_config_changes`. Enum values are snake_case in Postgres; `src/lib/labels.ts` maps them to human-readable display labels.

- **Immutability**: enforced by `BEFORE UPDATE/DELETE` triggers (migration `0006`), not application code or blanket RLS -- `calls.raw_transcript` can't change after insert, `agent_config_changes` core fields are frozen except `effectiveness_reviewed_at`/`effectiveness_notes`, and neither table allows deletes. This holds even against direct SQL, which is the point.
- **Access control**: RLS (migration `0007`) grants full select/insert/update `to authenticated` on all four tables, nothing to `anon`. There are no role tiers -- every Supabase Auth user is "staff". There is no `/signup` route anywhere in the app; that omission (not a check) is what enforces "no public signup". Staff accounts are created manually via the Supabase dashboard.

### The flagging engine is intentionally framework-free
`src/lib/flagging/` has zero Next.js/Supabase imports. `engine.ts::runFlaggingRules(call)` runs all 7 rules (one file each under `rules/`) and returns the triggered ones. This is what makes `npm run test` possible without a database, and it's why `scripts/seed.ts` imports the engine directly rather than hand-writing flag rows -- seed data and production behavior are guaranteed to match.

`src/lib/calls/insertCallAndFlag.ts::insertCallAndRunFlagging()` is the single shared path from "insert a call row" to "flags raised + urgent alerts fired". Both `src/actions/calls.ts` (session-based client, manual entry form) and `src/app/api/calls/ingest/route.ts` (secret-key client, no user session) call this same function so behavior can't drift between entry points. If you add a third ingestion path, route it through here too rather than reimplementing the insert+flag+alert sequence.

Urgent flag types (`ambiguous_safety_answer`, `safeguarding_keyword`, `possible_fabricated_summary`) are defined once in `src/lib/types/database.ts` as `URGENT_FLAG_TYPES`, checked via `isUrgentFlagType()` in `src/lib/alerts/sendUrgentAlert.ts`. `possible_fabricated_summary` is a hard flag by design (any unverified entity triggers it, no fuzzy matching) -- don't soften that without checking the spec's rationale.

### Supabase client wrappers -- use the right one
- `src/lib/supabase/server.ts` -- RLS-respecting, cookie-based, for Server Components and Server Actions. This is what almost everything should use.
- `src/lib/supabase/client.ts` -- browser client, for client components (e.g. login form, sidebar sign-out).
- `src/lib/supabase/admin.ts` -- secret-key client, bypasses RLS. Only for `scripts/seed.ts` and the ingestion API route.
- `src/proxy.ts` (not `middleware.ts` -- Next 16 renamed the convention; the exported function is named `proxy`, not `middleware`) refreshes the session and redirects unauthenticated requests away from everything except `/login`.

### `src/lib/types/database.ts` -- a hand-written type, regenerate-worthy gotcha
There's no live schema-introspection here, so these types are hand-written to mirror the SQL migrations. **They must be declared with `type`, not `interface`.** TypeScript only treats object-literal type aliases as satisfying an implicit `Record<string, unknown>` index signature; `interface` declarations don't, which silently makes every `@supabase/postgrest-js` query resolve to `never` (wrong-looking errors like "Property 'x' does not exist on type 'never'" or ".insert() expects never[]" trace back to this if it regresses). Each table also needs a `Relationships` array matching its actual FKs for embedded selects (e.g. `calls.select("*, review_flags(...)")`) to type-check. If a real Supabase project's schema changes, regenerate with `supabase gen types typescript` and diff against this file rather than hand-editing blind.

### shadcn/ui is on base-ui, not Radix -- no `asChild`
This project's shadcn install uses `@base-ui/react` primitives. Polymorphism uses a `render` prop, not Radix's `asChild`:

```tsx
// Correct (base-ui):
<Button render={<Link href="/calls/new" />}>New call</Button>

// Wrong (Radix pattern, will not type-check here):
<Button asChild><Link href="/calls/new">New call</Link></Button>
```

Same pattern for `DialogTrigger`/`DialogClose` etc. Also, base-ui `Select`'s `onValueChange` is typed `(value: string | null, ...) => void` (null on deselect) -- guard for null before passing to a setter that only accepts `string`.

### Forms: zod input vs output types
`src/lib/validation/callSchema.ts`'s `CallFormValues` is exported as `z.input<typeof callFormSchema>`, not `z.infer`/`z.output`. Fields with `.default(...)` are optional in the zod *input* type but required in the *output* type; `react-hook-form` + `zodResolver` hold form state in the input shape, so using the output type there breaks the resolver's generic. The Server Action re-parses with `safeParse()` and gets the fully-defaulted output type from `.data` regardless -- this split is intentional, don't collapse it back to one type.

### Server Actions own all writes
`src/actions/*.ts` (`calls.ts`, `review-flags.ts`, `known-issues.ts`, `config-changes.ts`) are the only place mutations happen. Dashboard pages under `src/app/(dashboard)/` are server components that fetch data directly via `src/lib/supabase/server.ts`; interactive bits (filters, mark-reviewed, forms) are small client components that call these actions and rely on `revalidatePath`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
