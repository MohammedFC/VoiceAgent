import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { FlagReviewPanel } from "@/components/review/flag-review-panel";
import { URGENCY_LEVEL_LABELS } from "@/lib/labels";
import { severityRank, urgencyBadgeVariant } from "@/lib/severity";
import { createClient } from "@/lib/supabase/server";

export default async function ReviewQueuePage() {
  const supabase = await createClient();

  const { data: flags, error } = await supabase
    .from("review_flags")
    .select(
      "*, calls(call_id, received_at, phone_number, caller_name, client_name, urgency_level, call_reason_category)",
    )
    .eq("resolved", false);

  const sortedFlags = [...(flags ?? [])].sort((a, b) => {
    const rankA = a.calls ? severityRank(a.calls.urgency_level, [a.flag_type]) : 0;
    const rankB = b.calls ? severityRank(b.calls.urgency_level, [b.flag_type]) : 0;
    if (rankB !== rankA) return rankB - rankA;
    return new Date(a.raised_at).getTime() - new Date(b.raised_at).getTime();
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Review queue</h1>
        <p className="text-sm text-muted-foreground">
          Unresolved flags across all calls, most severe and longest-waiting first.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">Failed to load review queue: {error.message}</p>}

      {/* A card list, not a table -- each flag carries a badge, reason text,
          a notes field, and a submit button, which doesn't compress into
          table columns without hiding the action off-screen on narrow
          viewports (the whole point of this page for an out-of-hours
          reviewer working from a phone). */}
      <div className="flex flex-col gap-4">
        {sortedFlags.length === 0 && (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            No unresolved flags. Nice work.
          </p>
        )}
        {sortedFlags.map((flag) => (
          <div key={flag.flag_id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(flag.raised_at), "d MMM, HH:mm")}
                </span>
                {flag.calls ? (
                  <Link href={`/calls/${flag.calls.call_id}`} className="font-medium hover:underline">
                    {flag.calls.client_name ?? flag.calls.phone_number}
                  </Link>
                ) : (
                  <span className="font-medium">—</span>
                )}
                {flag.calls?.caller_name && (
                  <span className="text-xs text-muted-foreground">({flag.calls.caller_name})</span>
                )}
              </div>
              {flag.calls && (
                <Badge variant={urgencyBadgeVariant(flag.calls.urgency_level)}>
                  {URGENCY_LEVEL_LABELS[flag.calls.urgency_level]}
                </Badge>
              )}
            </div>
            <FlagReviewPanel flag={flag} />
          </div>
        ))}
      </div>
    </div>
  );
}
