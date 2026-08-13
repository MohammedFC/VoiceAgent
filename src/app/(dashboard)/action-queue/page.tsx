import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { CallActionPanel } from "@/components/calls/call-action-panel";
import { URGENCY_LEVEL_LABELS } from "@/lib/labels";
import { URGENCY_RANK, urgencyBadgeVariant } from "@/lib/severity";
import { createClient } from "@/lib/supabase/server";

export default async function ActionQueuePage() {
  const supabase = await createClient();

  const { data: calls, error } = await supabase
    .from("calls")
    .select("*")
    .is("action_completed_at", null)
    .or("callback_requested.eq.true,urgency_level.eq.same_day_action_needed,urgency_level.eq.immediate_escalation")
    .order("received_at", { ascending: true });

  const sortedCalls = [...(calls ?? [])].sort((a, b) => {
    const rankDiff = URGENCY_RANK[b.urgency_level] - URGENCY_RANK[a.urgency_level];
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Action queue</h1>
        <p className="text-sm text-muted-foreground">
          Calls needing real-world follow-up (a callback, a same-day or immediate response) that
          haven&apos;t been marked actioned yet. Separate from the review queue, which checks
          whether Kath behaved correctly, not whether the follow-up itself happened.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">Failed to load action queue: {error.message}</p>}

      <div className="flex flex-col gap-4">
        {sortedCalls.length === 0 && (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            Nothing pending. Nice work.
          </p>
        )}
        {sortedCalls.map((call) => (
          <div key={call.call_id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(call.received_at), "d MMM, HH:mm")}
                </span>
                <Link href={`/calls/${call.call_id}`} className="font-medium hover:underline">
                  {call.client_name ?? call.phone_number}
                </Link>
                {call.caller_name && (
                  <span className="text-xs text-muted-foreground">({call.caller_name})</span>
                )}
              </div>
              <Badge variant={urgencyBadgeVariant(call.urgency_level)}>
                {URGENCY_LEVEL_LABELS[call.urgency_level]}
              </Badge>
            </div>
            <CallActionPanel call={call} />
          </div>
        ))}
      </div>
    </div>
  );
}
