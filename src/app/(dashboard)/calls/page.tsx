import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CallFilters } from "@/components/calls/call-filters";
import { FlagBadges } from "@/components/calls/flag-badges";
import { CALL_REASON_CATEGORY_LABELS, URGENCY_LEVEL_LABELS } from "@/lib/labels";
import { callNeedsAction, urgencyBadgeVariant } from "@/lib/severity";
import type { CallReasonCategory, FlagType, UrgencyLevel } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";

interface CallsPageProps {
  searchParams: Promise<{
    category?: string;
    urgency?: string;
    flag?: string;
    q?: string;
  }>;
}

export default async function CallsPage({ searchParams }: CallsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("calls")
    .select("*, review_flags(flag_id, flag_type, resolved)")
    .order("received_at", { ascending: false });

  if (params.category) {
    query = query.eq("call_reason_category", params.category as CallReasonCategory);
  }
  if (params.urgency) {
    query = query.eq("urgency_level", params.urgency as UrgencyLevel);
  }
  if (params.flag) {
    query = supabase
      .from("calls")
      .select("*, review_flags!inner(flag_id, flag_type, resolved)")
      .eq("review_flags.flag_type", params.flag as FlagType)
      .order("received_at", { ascending: false });
    if (params.category) query = query.eq("call_reason_category", params.category as CallReasonCategory);
    if (params.urgency) query = query.eq("urgency_level", params.urgency as UrgencyLevel);
  }
  if (params.q) {
    const term = `%${params.q}%`;
    query = query.or(
      `phone_number.ilike.${term},caller_name.ilike.${term},client_name.ilike.${term}`,
    );
  }

  const { data: calls, error } = await query;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calls</h1>
          <p className="text-sm text-muted-foreground">
            All out-of-hours calls handled by Kath, most recent first.
          </p>
        </div>
        <Button render={<Link href="/calls/new" />} nativeButton={false}>
          New call
        </Button>
      </div>

      <CallFilters />

      {error && <p className="text-sm text-destructive">Failed to load calls: {error.message}</p>}

      <p className="text-xs text-muted-foreground md:hidden">Swipe the table sideways to see more columns →</p>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Caller</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No calls found.
                </TableCell>
              </TableRow>
            )}
            {calls?.map((call) => (
              <TableRow key={call.call_id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/calls/${call.call_id}`} className="block">
                    {format(new Date(call.received_at), "d MMM yyyy, HH:mm")}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/calls/${call.call_id}`} className="block">
                    {call.phone_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/calls/${call.call_id}`} className="block">
                    {call.caller_name ?? "—"}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/calls/${call.call_id}`} className="block">
                    {call.client_name ?? "—"}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/calls/${call.call_id}`} className="block">
                    {CALL_REASON_CATEGORY_LABELS[call.call_reason_category]}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={urgencyBadgeVariant(call.urgency_level)}>
                    {URGENCY_LEVEL_LABELS[call.urgency_level]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {call.action_completed_at ? (
                    <Badge variant="success">Actioned</Badge>
                  ) : callNeedsAction(call) ? (
                    <Badge variant="warning">Needs action</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <FlagBadges
                    flags={call.review_flags.map((f) => ({
                      flagType: f.flag_type,
                      resolved: f.resolved,
                    }))}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
