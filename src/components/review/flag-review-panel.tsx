"use client";

import { useState } from "react";
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

  async function handleMarkReviewed() {
    setIsSubmitting(true);
    const result = await markFlagReviewed({ flagId: flag.flag_id, reviewerNotes: notes });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update flag");
      return;
    }
    setResolved(true);
    toast.success("Flag marked reviewed");
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Badge variant={resolved ? "outline" : isUrgentFlagType(flag.flag_type) ? "destructive" : "secondary"}>
          {FLAG_TYPE_LABELS[flag.flag_type]}
        </Badge>
        {resolved && <span className="text-xs text-muted-foreground">Reviewed by {flag.reviewed_by}</span>}
      </div>
      {flag.reason && <p className="text-sm text-muted-foreground">{flag.reason}</p>}
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
