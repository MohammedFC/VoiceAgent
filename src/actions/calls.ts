"use server";

import { revalidatePath } from "next/cache";

import { insertCallAndRunFlagging, type InsertCallResult } from "@/lib/calls/insertCallAndFlag";
import type { CallInsert } from "@/lib/types/database";
import { callFormSchema, type CallFormValues } from "@/lib/validation/callSchema";
import { createClient } from "@/lib/supabase/server";

export async function createCall(values: CallFormValues): Promise<InsertCallResult> {
  const parsed = callFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const insertPayload: CallInsert = {
    phone_number: data.phoneNumber,
    channel: data.channel,
    caller_name: data.callerName ?? null,
    caller_relationship: data.callerRelationship ?? null,
    client_name: data.clientName ?? null,
    client_address: data.clientAddress ?? null,
    address_confirmed: data.addressConfirmed,
    call_reason_category: data.callReasonCategory,
    urgency_level: data.urgencyLevel,
    special_instructions: data.specialInstructions ?? null,
    callback_requested: data.callbackRequested,
    callback_window: data.callbackWindow ?? null,
    transcript_completeness: data.transcriptCompleteness,
    ai_summary: data.aiSummary ?? null,
    summary_grounded: data.summaryGrounded,
    raw_transcript: data.rawTranscript,
    created_by: user?.id ?? null,
  };

  const result = await insertCallAndRunFlagging(supabase, insertPayload);

  if (result.success) {
    revalidatePath("/calls");
    revalidatePath("/review-queue");
    revalidatePath("/action-queue");
  }

  return result;
}

export interface MarkCallActionedInput {
  callId: string;
  actionNotes?: string;
}

export async function markCallActioned({ callId, actionNotes }: MarkCallActionedInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("calls")
    .update({
      action_completed_at: new Date().toISOString(),
      action_completed_by: user?.email ?? user?.id ?? "unknown",
      action_notes: actionNotes ?? null,
    })
    .eq("call_id", callId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/action-queue");
  revalidatePath("/calls");
  revalidatePath(`/calls/${callId}`);

  return { success: true };
}
