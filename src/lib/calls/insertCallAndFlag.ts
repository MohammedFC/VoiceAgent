import type { SupabaseClient } from "@supabase/supabase-js";

import { isUrgentFlagType, sendUrgentAlert } from "@/lib/alerts/sendUrgentAlert";
import { runFlaggingRules } from "@/lib/flagging/engine";
import type { CallInsert, Database, ReviewFlagInsert } from "@/lib/types/database";

export interface InsertCallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

// Shared by the manual entry Server Action (src/actions/calls.ts) and
// the ingestion API stub (src/app/api/calls/ingest/route.ts) so every
// entry point runs the exact same flagging + alerting logic, regardless
// of which Supabase client (session-based vs secret-key) inserted the
// row.
export async function insertCallAndRunFlagging(
  supabase: SupabaseClient<Database>,
  insertPayload: CallInsert,
): Promise<InsertCallResult> {
  const { data: insertedCall, error: insertError } = await supabase
    .from("calls")
    .insert(insertPayload)
    .select("call_id")
    .single();

  if (insertError || !insertedCall) {
    return { success: false, error: insertError?.message ?? "Failed to create call" };
  }

  const callId = insertedCall.call_id;

  const flagResults = runFlaggingRules({
    callId,
    rawTranscript: insertPayload.raw_transcript,
    aiSummary: insertPayload.ai_summary ?? null,
    clientAddress: insertPayload.client_address ?? null,
    addressConfirmed: insertPayload.address_confirmed ?? false,
  });

  if (flagResults.length > 0) {
    const flagRows: ReviewFlagInsert[] = flagResults.map((flag) => ({
      call_id: callId,
      flag_type: flag.flagType,
      reason: flag.reason,
    }));

    const { error: flagsError } = await supabase.from("review_flags").insert(flagRows);
    if (flagsError) {
      console.error("Failed to insert review flags", flagsError);
    }

    await Promise.all(
      flagResults
        .filter((flag) => isUrgentFlagType(flag.flagType))
        .map((flag) =>
          sendUrgentAlert({
            callId,
            flagType: flag.flagType,
            reason: flag.reason,
            raisedAt: new Date().toISOString(),
          }),
        ),
    );
  }

  return { success: true, callId };
}
