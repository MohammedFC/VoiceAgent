import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

// Secret-key client that bypasses RLS entirely. Only for trusted
// server-side automation: the seed script (scripts/seed.ts) and the
// future email-ingestion worker behind app/api/calls/ingest/route.ts.
// Never import this from a Server Component, Server Action reachable by
// end users, or anywhere a browser could trigger it.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "createAdminClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to be set.",
    );
  }

  return createSupabaseClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
