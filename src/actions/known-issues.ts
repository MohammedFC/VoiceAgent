"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { KnownIssueStatus } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";

export interface CreateKnownIssueInput {
  title: string;
  description?: string;
  firstSeenCallId?: string;
}

export async function createKnownIssue(input: CreateKnownIssueInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("known_issues")
    .insert({
      title: input.title,
      description: input.description ?? null,
      first_seen_call_id: input.firstSeenCallId ?? null,
      example_call_ids: input.firstSeenCallId ? [input.firstSeenCallId] : [],
    })
    .select("issue_id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to create known issue" };
  }

  revalidatePath("/known-issues");
  redirect(`/known-issues/${data.issue_id}`);
}

export async function updateKnownIssueStatus(issueId: string, status: KnownIssueStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("known_issues")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("issue_id", issueId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/known-issues");
  revalidatePath(`/known-issues/${issueId}`);

  return { success: true };
}
