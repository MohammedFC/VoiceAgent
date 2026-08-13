# Out-of-Hours Call Log & Review Dashboard

Structured, searchable call log and review dashboard for Jewel Home Support's out-of-hours voice agent ("Kath"), replacing the previous email-based record system. Built from `Call-Log-App-Spec.md`.

Stack: Next.js (App Router) + TypeScript + Supabase (Postgres + Auth) + Tailwind + shadcn/ui.

## What's stubbed in v1

Two integrations are deliberately stubbed rather than wired to real external services, per the build decisions:

- **Email ingestion** (spec section 3): calls currently arrive as emails to `voiceagent@jewelhomesupport.co.uk`. Instead of parsing that inbox, this build has (a) a manual "New call" entry form and (b) a working `POST /api/calls/ingest` endpoint that accepts the same 4-part template shape (`callerName`, `phoneNumber`, `reasonOfCall`, `transcript`) and runs it through the same flagging logic. A future email-parsing worker (e.g. polling the inbox via the Microsoft Graph API) can call this endpoint directly -- see `src/app/api/calls/ingest/route.ts`.
- **Urgent SMS/voice alerting** (spec section 4): urgent flags (`ambiguous_safety_answer`, `safeguarding_keyword`, `possible_fabricated_summary`) currently only trigger an in-app banner, not a real SMS/call to the on-call manager. `src/lib/alerts/sendUrgentAlert.ts` is a stable, isolated stub -- dropping in a real provider (e.g. Twilio) later is a one-file change.

## Setup

### 1. Create a Supabase project

Create a new project at [supabase.com](https://supabase.com/dashboard). For UK data residency (this system holds vulnerable adults' personal and health-adjacent data -- spec section 6), choose the **London (eu-west-2)** region if available, or another EU region.

### 2. Run the migrations

Either:

- **Via script**: add `SUPABASE_DB_URL` to `.env.local` (Project Settings -> Database -> Connect -> Session pooler or direct connection URI, with your real password -- percent-encode any special characters in it, e.g. `@` becomes `%40`), then run `npm run migrate`. It applies all 7 files in `supabase/migrations/` in order inside a single transaction and never prints the connection string, including on error.
- **Via SQL editor**: open the SQL editor in the Supabase Dashboard and run each file in `supabase/migrations/` **in order** (`0001_enums.sql` through `0007_rls_policies.sql`) by hand.
- **Via Supabase CLI**: `supabase db push` applies them in the same order.

`SUPABASE_DB_URL` is only used by `npm run migrate` -- the app itself never reads it.

### 3. Set environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from Project Settings -> API -> API keys (the "Publishable key", safe to expose to the browser), and `SUPABASE_SECRET_KEY` from the "Secret keys" section on the same page. **Never commit `.env.local`** or expose the secret key to the browser.

### 4. Create your first staff account

There is no self-service sign-up (by design -- see "Access control" below). In the Supabase Dashboard, go to **Authentication -> Users -> Add user** and create an account with an email and password for each authorised staff member.

### 5. Install dependencies and seed sample data

```bash
npm install
npm run seed
```

This inserts ~12 hand-authored calls covering every auto-flagging rule, plus a couple of known issues and a config change, so the dashboard has realistic data to review immediately. Pass `-- --reset` to wipe existing seed rows first (destructive, dev-only):

```bash
npm run seed -- --reset
```

### 6. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with the staff account you created in step 4.

## Access control

Every Supabase Auth user is treated as authorised staff -- there are no role tiers in v1, since the spec only calls for "authorised staff only, no public signup." The app has no `/signup` route at all; that omission is the enforcement mechanism. Row Level Security is enabled on all four tables and only grants access `to authenticated` users (see `supabase/migrations/0007_rls_policies.sql`), so even a leaked publishable key can't expose data without valid staff credentials.

## Audit trail

`raw_transcript` (on `calls`) and the core fields of `agent_config_changes` are immutable after creation, enforced by database triggers rather than application code (see `supabase/migrations/0006_immutability_triggers.sql`) -- so this holds even if written to directly via SQL. No rows in either table can be deleted. `agent_config_changes.effectiveness_reviewed_at`/`effectiveness_notes` remain updatable, since that's how the "mark reviewed for effectiveness" action works.

## Testing

```bash
npm run test        # Vitest: full unit coverage of the auto-flagging engine (src/lib/flagging/)
npm run typecheck    # tsc --noEmit
npm run lint          # ESLint
npm run build        # Next.js production build
```

The flagging engine (`src/lib/flagging/`) has no Next.js or Supabase imports, so its tests run without a database. Everything else (auth, RLS, the immutability triggers, real dashboard data) needs a live Supabase project -- there wasn't one available while building this, so exercise those manually once you've completed the setup steps above.

## Project structure

- `supabase/migrations/` -- schema, enums, immutability triggers, RLS policies (spec section 2 and 6)
- `src/lib/flagging/` -- the seven auto-flagging rules and the engine that runs them (spec section 4)
- `src/lib/alerts/sendUrgentAlert.ts` -- urgent alert stub (spec section 4)
- `src/lib/calls/insertCallAndFlag.ts` -- shared insert + flag + alert logic, used by both the manual entry form and the ingestion API stub
- `src/actions/` -- Server Actions for all writes (calls, review flags, known issues, config changes)
- `src/app/(dashboard)/` -- the six dashboard views (spec section 5): calls, review queue, known issues, config changes, stats
- `scripts/seed.ts` -- seed data covering every flag type, run through the real flagging engine

## Not built (by design)

Per spec section 6: no autonomous model retraining or fine-tuning from stored call data. Improvement happens through the human review -> known issue -> config change -> effectiveness check loop that the "Known issues" and "Config changes" pages support, not automatically.
