import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Raised</TableHead>
              <TableHead>Call</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Flag & review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFlags.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No unresolved flags. Nice work.
                </TableCell>
              </TableRow>
            )}
            {sortedFlags.map((flag) => (
              <TableRow key={flag.flag_id}>
                <TableCell className="whitespace-nowrap align-top">
                  {format(new Date(flag.raised_at), "d MMM, HH:mm")}
                </TableCell>
                <TableCell className="align-top">
                  {flag.calls ? (
                    <Link href={`/calls/${flag.calls.call_id}`} className="flex flex-col">
                      <span className="font-medium">{flag.calls.client_name ?? flag.calls.phone_number}</span>
                      <span className="text-xs text-muted-foreground">{flag.calls.caller_name}</span>
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="align-top">
                  {flag.calls && (
                    <Badge variant={urgencyBadgeVariant(flag.calls.urgency_level)}>
                      {URGENCY_LEVEL_LABELS[flag.calls.urgency_level]}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="min-w-80 align-top">
                  <FlagReviewPanel flag={flag} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
