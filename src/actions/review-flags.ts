"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface MarkReviewedInput {
  flagId: string;
  reviewerNotes?: string;
}

export async function markFlagReviewed({ flagId, reviewerNotes }: MarkReviewedInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("review_flags")
    .update({
      resolved: true,
      reviewed_by: user?.email ?? user?.id ?? "unknown",
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes ?? null,
    })
    .eq("flag_id", flagId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/review-queue");
  revalidatePath("/calls");

  return { success: true };
}
