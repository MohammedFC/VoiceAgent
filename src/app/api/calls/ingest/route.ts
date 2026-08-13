import { NextResponse } from "next/server";

import { insertCallAndRunFlagging } from "@/lib/calls/insertCallAndFlag";
import type { CallInsert } from "@/lib/types/database";
import { ingestPayloadSchema } from "@/lib/validation/callSchema";
import { createAdminClient } from "@/lib/supabase/admin";

// Ingestion entry point matching the existing 4-part email template
// (Caller Name / Phone Number / Reason of Call / Transcript), per spec
// section 3. There is no email listener wired up in v1 -- this is the
// stable contract a future worker (e.g. polling the voiceagent@ inbox
// via the Microsoft Graph API) would POST to. Authenticated with a
// bearer token against SUPABASE_SECRET_KEY since a background worker
// has no staff browser session.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_SECRET_KEY ?? ""}`;
  if (!process.env.SUPABASE_SECRET_KEY || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ingestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 },
    );
  }
  const { callerName, phoneNumber, reasonOfCall, transcript } = parsed.data;

  const insertPayload: CallInsert = {
    phone_number: phoneNumber,
    channel: "Oncall",
    caller_name: callerName ?? null,
    caller_relationship: null,
    client_name: null,
    client_address: null,
    address_confirmed: false,
    call_reason_category: "other",
    urgency_level: "routine",
    special_instructions: reasonOfCall ?? null,
    callback_requested: false,
    callback_window: null,
    transcript_completeness: "complete",
    ai_summary: null,
    summary_grounded: true,
    raw_transcript: transcript,
    created_by: null,
  };

  const admin = createAdminClient();
  const result = await insertCallAndRunFlagging(admin, insertPayload);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ callId: result.callId }, { status: 201 });
}
