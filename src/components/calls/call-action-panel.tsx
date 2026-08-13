"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { markCallActioned } from "@/actions/calls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CallRow } from "@/lib/types/database";

type ActionableCall = Pick<
  CallRow,
  "call_id" | "action_completed_at" | "action_completed_by" | "action_notes" | "callback_requested" | "callback_window"
>;

export function CallActionPanel({ call }: { call: ActionableCall }) {
  const [notes, setNotes] = useState(call.action_notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedAt, setCompletedAt] = useState(call.action_completed_at);

  async function handleMarkActioned() {
    setIsSubmitting(true);
    const result = await markCallActioned({ callId: call.call_id, actionNotes: notes });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update call");
      return;
    }
    setCompletedAt(new Date().toISOString());
    toast.success("Call marked actioned");
  }

  if (completedAt) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-success/30 bg-success/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">Actioned</Badge>
          <span className="text-xs text-muted-foreground">
            {call.action_completed_by ? `by ${call.action_completed_by} · ` : ""}
            {format(new Date(completedAt), "d MMM yyyy, HH:mm")}
          </span>
        </div>
        {notes && <p className="text-sm text-muted-foreground">{notes}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-warning/30 bg-warning/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Action needed</Badge>
        {call.callback_requested && (
          <span className="text-xs text-muted-foreground">
            Callback requested{call.callback_window ? ` — ${call.callback_window}` : ""}
          </span>
        )}
      </div>
      <Textarea
        placeholder="What was done? (optional)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={2}
      />
      <Button size="sm" className="self-start" onClick={handleMarkActioned} disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Mark actioned"}
      </Button>
    </div>
  );
}
