"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { markFlagReviewed } from "@/actions/review-flags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isUrgentFlagType } from "@/lib/alerts/sendUrgentAlert";
import { FLAG_TYPE_LABELS } from "@/lib/labels";
import type { ReviewFlagRow } from "@/lib/types/database";

export function FlagReviewPanel({ flag }: { flag: ReviewFlagRow }) {
  const [notes, setNotes] = useState(flag.reviewer_notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolved, setResolved] = useState(flag.resolved);
  const [reviewedAt, setReviewedAt] = useState(flag.reviewed_at);

  async function handleMarkReviewed() {
    setIsSubmitting(true);
    const result = await markFlagReviewed({ flagId: flag.flag_id, reviewerNotes: notes });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update flag");
      return;
    }
    setResolved(true);
    setReviewedAt(new Date().toISOString());
    toast.success("Flag marked reviewed");
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      {/* Issue first: what was flagged and why. Only once that's established
          does the review outcome (who/when) follow -- marking something
          reviewed should never bury the reason it was flagged. */}
      <Badge variant={resolved ? "success" : isUrgentFlagType(flag.flag_type) ? "destructive" : "secondary"}>
        {FLAG_TYPE_LABELS[flag.flag_type]}
      </Badge>
      {flag.reason && <p className="text-sm text-muted-foreground">{flag.reason}</p>}
      {resolved && (
        <span className="text-xs text-muted-foreground">
          Reviewed by {flag.reviewed_by}
          {reviewedAt ? ` · ${format(new Date(reviewedAt), "d MMM yyyy, HH:mm")}` : ""}
        </span>
      )}
      <Textarea
        placeholder="Reviewer notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        disabled={resolved}
        rows={2}
      />
      {!resolved && (
        <Button size="sm" className="self-start" onClick={handleMarkReviewed} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Mark reviewed"}
        </Button>
      )}
    </div>
  );
}
