"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface CreateConfigChangeInput {
  knownIssueId?: string;
  descriptionOfChange: string;
  changedBy: string;
}

export async function createConfigChange(input: CreateConfigChangeInput) {
  const supabase = await createClient();

  const { error } = await supabase.from("agent_config_changes").insert({
    known_issue_id: input.knownIssueId ?? null,
    description_of_change: input.descriptionOfChange,
    changed_by: input.changedBy,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/config-changes");
  redirect("/config-changes");
}

export interface MarkEffectivenessReviewedInput {
  changeId: string;
  effectivenessNotes?: string;
}

export async function markEffectivenessReviewed({
  changeId,
  effectivenessNotes,
}: MarkEffectivenessReviewedInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("agent_config_changes")
    .update({
      effectiveness_reviewed_at: new Date().toISOString().slice(0, 10),
      effectiveness_notes: effectivenessNotes ?? null,
    })
    .eq("change_id", changeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/config-changes");

  return { success: true };
}
