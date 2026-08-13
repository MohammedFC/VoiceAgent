// Seed script for local/dev use. Run with `npm run seed` (add `-- --reset`
// to wipe existing rows first). Requires NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SECRET_KEY in .env.local (see README for setup steps).
//
// Runs every call through the SAME runFlaggingRules() engine used in
// production (src/lib/flagging/engine.ts) rather than hand-writing
// review_flags rows, so seed data and real behaviour stay consistent.

import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

import { runFlaggingRules } from "../src/lib/flagging/engine";
import { isUrgentFlagType } from "../src/lib/alerts/sendUrgentAlert";
import { createAdminClient } from "../src/lib/supabase/admin";
import type { CallInsert, ReviewFlagInsert } from "../src/lib/types/database";

loadEnv({ path: join(__dirname, "..", ".env.local") });

const RESET = process.argv.includes("--reset");

interface SeedCall extends CallInsert {
  // Used only to mark specific seed flags as already reviewed, for realism.
  preReviewedFlagTypes?: string[];
}

const SEED_CALLS: SeedCall[] = [
  {
    phone_number: "07700 900001",
    channel: "Landline",
    caller_name: "Jane Doe",
    caller_relationship: "family",
    client_name: "Margaret Doe",
    client_address: "12 High Street, London, SW1A 1AA",
    address_confirmed: true,
    call_reason_category: "cancellation",
    urgency_level: "routine",
    special_instructions: null,
    callback_requested: false,
    callback_window: null,
    transcript_completeness: "complete",
    ai_summary: "Jane Doe requested a visit cancellation for tomorrow on behalf of her mother, Margaret.",
    summary_grounded: true,
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: Hi, I need to cancel tomorrow's visit for my mum, Margaret.",
      "Agent: No problem. Can I take your name and confirm the address?",
      "Caller: Jane Doe, and it's 12 High Street, London, SW1A 1AA.",
      "Agent: Thanks Jane, can you confirm that address and postcode is correct?",
      "Caller: Yes, that's right.",
      "Agent: Great, that visit is cancelled. Anything else?",
      "Caller: No that's everything, thank you.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900002",
    channel: "Oncall",
    caller_name: "Peter Smith",
    caller_relationship: "carer",
    client_name: "Harold Smith",
    client_address: "45 Church Road, Manchester, M1 1AE",
    address_confirmed: true,
    call_reason_category: "safeguarding",
    urgency_level: "immediate_escalation",
    special_instructions: "Escalate to on-call manager immediately.",
    callback_requested: true,
    callback_window: "As soon as possible",
    transcript_completeness: "complete",
    ai_summary: "Caller raised a safeguarding concern about a missed care visit.",
    summary_grounded: true,
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: I'm worried, my dad's carer hasn't come today and he takes medication at this time. I'm worried he's being neglected.",
      "Agent: I understand, that's very concerning. Let me take some details and flag this urgently.",
      "Caller: Okay, thank you, please hurry.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900003",
    channel: "Landline",
    caller_name: "Susan Lee",
    caller_relationship: "family",
    client_name: "Robert Lee",
    client_address: "8 Mill Lane, Bristol, BS1 4ST",
    address_confirmed: true,
    call_reason_category: "general_query",
    urgency_level: "routine",
    special_instructions: null,
    callback_requested: false,
    callback_window: null,
    transcript_completeness: "complete",
    // Deliberately fabricated: "David Lee" and "Leeds" never appear in the transcript.
    ai_summary: "David Lee called to ask about visit times for his father in Leeds.",
    summary_grounded: false,
    preReviewedFlagTypes: ["possible_fabricated_summary"],
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: Hi, I just wanted to check what time the carer usually visits my dad Robert.",
      "Agent: Sure, let me check that for you. It's usually around 8am and 6pm.",
      "Caller: Great, thank you, that's all I needed.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900004",
    channel: "Landline",
    caller_name: "Unknown caller",
    caller_relationship: "other",
    client_name: "Unnamed client",
    client_address: "somewhere near the old church, not sure of the postcode",
    address_confirmed: false,
    call_reason_category: "missed_check_in",
    urgency_level: "same_day_action_needed",
    special_instructions: null,
    callback_requested: true,
    callback_window: "This afternoon",
    transcript_completeness: "complete",
    ai_summary: "Caller reported a missed check-in but could not confirm the address.",
    summary_grounded: true,
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: My neighbour missed her check-in call today, I don't know her exact address.",
      "Agent: Okay, can you describe where she lives?",
      "Caller: It's somewhere near the old church, I'm not sure of the postcode.",
      "Agent: No problem, I'll flag this for a callback this afternoon.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900005",
    channel: "Landline",
    caller_name: "Alan Grant",
    caller_relationship: "client",
    client_name: "Alan Grant",
    client_address: "3 Station Road, Leeds, LS1 2AB",
    address_confirmed: true,
    call_reason_category: "cancellation",
    urgency_level: "routine",
    special_instructions: null,
    callback_requested: false,
    callback_window: null,
    transcript_completeness: "complete",
    ai_summary: "Alan Grant requested a visit cancellation.",
    summary_grounded: true,
    // Same agent question repeated with no new caller content in between.
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: I need to cancel my visit tomorrow.",
      "Agent: Can you confirm your name and address please?",
      "Agent: Can you confirm your name and address please?",
      "Caller: Sorry, it's Alan Grant, 3 Station Road, Leeds, LS1 2AB.",
      "Agent: Thanks Alan, that's cancelled.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900006",
    channel: "Landline",
    caller_name: "Grace Kim",
    caller_relationship: "family",
    client_name: "Dorothy Kim",
    client_address: "22 Park Avenue, Birmingham, B1 1AA",
    address_confirmed: true,
    call_reason_category: "general_query",
    urgency_level: "routine",
    special_instructions: null,
    callback_requested: false,
    callback_window: null,
    transcript_completeness: "complete",
    ai_summary: "Caller asked to speak to a human staff member rather than the voice agent.",
    summary_grounded: true,
    preReviewedFlagTypes: ["human_requested"],
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: Actually, I don't want to talk to a robot, can I speak to a real person please?",
      "Agent: Of course, I'll arrange for a member of staff to call you back.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900007",
    channel: "Oncall",
    caller_name: null,
    caller_relationship: null,
    client_name: null,
    client_address: null,
    address_confirmed: false,
    call_reason_category: "other",
    urgency_level: "routine",
    special_instructions: null,
    callback_requested: false,
    callback_window: null,
    transcript_completeness: "failed",
    ai_summary: null,
    summary_grounded: true,
    // Dropped call: only the agent's opening line.
    raw_transcript: "Agent: Hello, this is Kath, how can I help?",
  },
  {
    phone_number: "07700 900008",
    channel: "Landline",
    caller_name: "Tom Baker",
    caller_relationship: "carer",
    client_name: "Ivy Baker",
    client_address: "5 Queens Road, Sheffield, S1 2HE",
    address_confirmed: true,
    call_reason_category: "medical_emergency",
    urgency_level: "immediate_escalation",
    special_instructions: "Caller unsure if ambulance is needed.",
    callback_requested: true,
    callback_window: "Immediately",
    transcript_completeness: "complete",
    ai_summary: "Caller was unsure whether the client was conscious and breathing normally.",
    summary_grounded: true,
    // Contradictory answer near a safety question.
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: I think Ivy has fallen, I'm not sure what's happening.",
      "Agent: Is she conscious and breathing?",
      "Caller: Yes -- no, wait, I mean yes, I think so, but I'm not certain.",
      "Agent: Okay, I'm escalating this immediately, please stay on the line.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900009",
    channel: "Landline",
    caller_name: "Emily Clarke",
    caller_relationship: "family",
    client_name: "Frank Clarke",
    client_address: "17 Victoria Street, Leeds, LS2 7PQ",
    address_confirmed: true,
    call_reason_category: "cancellation",
    urgency_level: "routine",
    special_instructions: null,
    callback_requested: false,
    callback_window: null,
    transcript_completeness: "complete",
    ai_summary: "Emily Clarke cancelled Friday's visit for her father Frank.",
    summary_grounded: true,
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: I need to cancel Friday's visit for my dad Frank.",
      "Agent: No problem, can I take your name?",
      "Caller: Emily Clarke.",
      "Agent: Thanks Emily, that's cancelled for Friday.",
      "Caller: Perfect, thank you.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900010",
    channel: "Landline",
    caller_name: "George Hunt",
    caller_relationship: "client",
    client_name: "George Hunt",
    client_address: "9 Orchard Close, Bristol, BS3 5XY",
    address_confirmed: true,
    call_reason_category: "missed_check_in",
    urgency_level: "same_day_action_needed",
    special_instructions: null,
    callback_requested: true,
    callback_window: "Within the hour",
    transcript_completeness: "complete",
    ai_summary: "The caller reported a missed check-in call and requested a callback within the hour.",
    summary_grounded: true,
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: I was supposed to get a check-in call an hour ago and nobody's called.",
      "Agent: I'm sorry about that, let me flag this for a callback within the hour.",
      "Caller: Thank you, I appreciate it.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900011",
    channel: "Landline",
    caller_name: "Nina Patel",
    caller_relationship: "family",
    client_name: "Raj Patel",
    client_address: "60 Kings Road, Reading, RG1 3AA",
    address_confirmed: true,
    call_reason_category: "general_query",
    urgency_level: "routine",
    special_instructions: null,
    callback_requested: false,
    callback_window: null,
    transcript_completeness: "complete",
    ai_summary: "The caller asked about updating her father's dietary requirements on file, noting he is now diabetic.",
    summary_grounded: true,
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: I'd like to update my dad Raj's dietary requirements on file, he's now diabetic.",
      "Agent: Thanks for letting us know, I'll pass that on to the day team to update.",
      "Caller: Great, thanks.",
    ].join("\n"),
  },
  {
    phone_number: "07700 900012",
    channel: "Oncall",
    caller_name: "Carl Owusu",
    caller_relationship: "carer",
    client_name: "Beatrice Owusu",
    client_address: "88 Mill Road, Cambridge, CB1 2AS",
    address_confirmed: true,
    call_reason_category: "other",
    urgency_level: "routine",
    special_instructions: null,
    callback_requested: false,
    callback_window: null,
    transcript_completeness: "partial",
    ai_summary: "Carer called to report a minor scheduling clash with another appointment.",
    summary_grounded: true,
    raw_transcript: [
      "Agent: Hello, this is Kath, how can I help?",
      "Caller: I've got a scheduling clash between the visit and a GP appointment next week.",
      "Agent: Understood, I'll flag this so the rota can be adjusted.",
      "Caller: Thanks, that's all",
    ].join("\n"),
  },
];

async function main() {
  const admin = createAdminClient();

  if (RESET) {
    console.log("--reset passed: clearing existing seed tables (dev-only, destructive)...");
    // calls and agent_config_changes have BEFORE DELETE triggers that
    // unconditionally reject deletes (audit-trail immutability, see
    // supabase/migrations/0006_immutability_triggers.sql) -- a normal
    // PostgREST .delete() on them fails silently unless you check the
    // error. TRUNCATE doesn't fire row-level triggers, so it's the only
    // way to actually reset those two tables; it needs a direct SQL
    // connection rather than the admin REST client.
    const dbUrl = process.env.SUPABASE_DB_URL;
    if (!dbUrl) {
      console.error(
        "--reset requires SUPABASE_DB_URL in .env.local -- calls/agent_config_changes are delete-protected by DB triggers, so clearing them needs a direct SQL TRUNCATE, not the REST API.",
      );
      process.exit(1);
    }

    const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
      await pgClient.connect();
      await pgClient.query(
        "truncate table agent_config_changes, known_issues, review_flags, calls restart identity cascade",
      );
    } catch (resetError) {
      const message = resetError instanceof Error ? resetError.message : String(resetError);
      console.error("Failed to reset tables:", message.split(dbUrl).join("[REDACTED]"));
      process.exit(1);
    } finally {
      await pgClient.end();
    }
  }

  let insertedCallCount = 0;
  let insertedFlagCount = 0;
  let fabricatedSummaryCallId: string | null = null;
  let lowConfidenceAddressCallId: string | null = null;

  for (const seedCall of SEED_CALLS) {
    const { preReviewedFlagTypes, ...insertPayload } = seedCall;

    const { data: insertedCall, error: insertError } = await admin
      .from("calls")
      .insert(insertPayload)
      .select("call_id")
      .single();

    if (insertError || !insertedCall) {
      console.error("Failed to insert call", insertPayload.phone_number, insertError);
      continue;
    }

    insertedCallCount++;
    const callId = insertedCall.call_id;

    const flagResults = runFlaggingRules({
      callId,
      rawTranscript: insertPayload.raw_transcript,
      aiSummary: insertPayload.ai_summary ?? null,
      clientAddress: insertPayload.client_address ?? null,
      addressConfirmed: insertPayload.address_confirmed ?? false,
    });

    if (flagResults.some((f) => f.flagType === "possible_fabricated_summary")) {
      fabricatedSummaryCallId = callId;
    }
    if (flagResults.some((f) => f.flagType === "low_confidence_address")) {
      lowConfidenceAddressCallId = callId;
    }

    if (flagResults.length === 0) continue;

    // Every row must set the same keys: PostgREST bulk-inserts an array of
    // objects as one statement using the union of keys across all rows, so
    // a row missing a key (e.g. `resolved`) gets an explicit SQL NULL
    // instead of falling back to the column default -- which breaks the
    // NOT NULL constraint on any call whose flags mix reviewed/unreviewed.
    const flagRows: ReviewFlagInsert[] = flagResults.map((flag) => {
      const isPreReviewed = preReviewedFlagTypes?.includes(flag.flagType) ?? false;
      return {
        call_id: callId,
        flag_type: flag.flagType,
        reason: flag.reason,
        resolved: isPreReviewed,
        reviewed_by: isPreReviewed ? "seed-script@jewelhomesupport.co.uk" : null,
        reviewed_at: isPreReviewed ? new Date().toISOString() : null,
        reviewer_notes: isPreReviewed ? "Reviewed during seed data setup." : null,
      };
    });

    const { error: flagsError } = await admin.from("review_flags").insert(flagRows);
    if (flagsError) {
      console.error("Failed to insert flags for call", callId, flagsError);
      continue;
    }
    insertedFlagCount += flagRows.length;

    for (const flag of flagResults) {
      if (isUrgentFlagType(flag.flagType)) {
        console.log(`  (would send urgent alert for ${flag.flagType} on call ${callId})`);
      }
    }
  }

  let insertedIssueCount = 0;
  let insertedConfigChangeCount = 0;

  if (fabricatedSummaryCallId) {
    const { data: issue } = await admin
      .from("known_issues")
      .insert({
        title: "AI summary occasionally includes names/places not in the transcript",
        description:
          "Two confirmed cases of the summarisation step inventing entities that never appeared in the call. Treated as a hard flag per the review report.",
        first_seen_call_id: fabricatedSummaryCallId,
        status: "monitoring",
        example_call_ids: [fabricatedSummaryCallId],
      })
      .select("issue_id")
      .single();

    if (issue) {
      insertedIssueCount++;
      const { error: changeError } = await admin.from("agent_config_changes").insert({
        known_issue_id: issue.issue_id,
        description_of_change:
          "Added an explicit instruction to the summarisation prompt to only reference names, places, and requests that appear verbatim in the transcript.",
        changed_by: "seed-script@jewelhomesupport.co.uk",
      });
      if (!changeError) insertedConfigChangeCount++;
    }
  }

  if (lowConfidenceAddressCallId) {
    const { error: issueError } = await admin.from("known_issues").insert({
      title: "Addresses captured without a valid postcode or read-back confirmation",
      description:
        "Callers sometimes give a vague location instead of a postcode, and the agent doesn't always read the address back to confirm it.",
      first_seen_call_id: lowConfidenceAddressCallId,
      status: "open",
      example_call_ids: [lowConfidenceAddressCallId],
    });
    if (!issueError) insertedIssueCount++;
  }

  console.log(
    `\nSeed complete: inserted ${insertedCallCount} calls, ${insertedFlagCount} flags, ${insertedIssueCount} known issues, ${insertedConfigChangeCount} config changes.`,
  );
}

main().catch((error) => {
  console.error("Seed script failed:", error);
  process.exit(1);
});
