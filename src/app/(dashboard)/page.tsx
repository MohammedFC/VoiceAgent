import Link from "next/link";
import { format, isToday, subDays } from "date-fns";

import { isUrgentFlagType } from "@/lib/alerts/sendUrgentAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/stats/stat-tile";
import { TrendChart, type TrendPoint } from "@/components/stats/trend-chart";
import { FLAG_TYPE_LABELS, KNOWN_ISSUE_STATUS_LABELS, URGENCY_LEVEL_LABELS } from "@/lib/labels";
import {
  KNOWN_ISSUE_STATUS_VARIANT,
  URGENCY_RANK,
  callNeedsAction,
  severityRank,
  urgencyBadgeVariant,
} from "@/lib/severity";
import { createClient } from "@/lib/supabase/server";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: calls }, { data: unresolvedFlags }, { data: knownIssues }] = await Promise.all([
    supabase.from("calls").select("*").order("received_at", { ascending: false }),
    supabase
      .from("review_flags")
      .select("*, calls(call_id, client_name, phone_number, caller_name, urgency_level)")
      .eq("resolved", false),
    supabase.from("known_issues").select("*").order("created_at", { ascending: false }),
  ]);

  const allCalls = calls ?? [];
  const allUnresolvedFlags = unresolvedFlags ?? [];
  const allKnownIssues = knownIssues ?? [];

  const pendingActionCalls = allCalls
    .filter((call) => callNeedsAction(call) && !call.action_completed_at)
    .sort((a, b) => {
      const rankDiff = URGENCY_RANK[b.urgency_level] - URGENCY_RANK[a.urgency_level];
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
    });

  const sortedUnresolvedFlags = [...allUnresolvedFlags].sort((a, b) => {
    const rankA = a.calls ? severityRank(a.calls.urgency_level, [a.flag_type]) : 0;
    const rankB = b.calls ? severityRank(b.calls.urgency_level, [b.flag_type]) : 0;
    if (rankB !== rankA) return rankB - rankA;
    return new Date(a.raised_at).getTime() - new Date(b.raised_at).getTime();
  });

  const openIssues = allKnownIssues.filter(
    (issue) => issue.status === "open" || issue.status === "monitoring",
  );

  const immediateEscalationCount = allCalls.filter(
    (call) => call.urgency_level === "immediate_escalation" && !call.action_completed_at,
  ).length;

  const callsToday = allCalls.filter((call) => isToday(new Date(call.received_at))).length;

  const trendWindowDays = 14;
  const today = new Date();
  const dayBuckets = new Map<string, number>();
  for (let i = trendWindowDays - 1; i >= 0; i--) {
    dayBuckets.set(format(subDays(today, i), "d MMM"), 0);
  }
  for (const call of allCalls) {
    const key = format(new Date(call.received_at), "d MMM");
    if (dayBuckets.has(key)) {
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }
  }
  const trendData: TrendPoint[] = Array.from(dayBuckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const recentCalls = allCalls.slice(0, 5);
  const allClear = pendingActionCalls.length === 0 && sortedUnresolvedFlags.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{greeting()}</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE d MMMM yyyy")}</p>
        </div>
        <Button render={<Link href="/calls/new" />} nativeButton={false}>
          New call
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Pending actions"
          value={pendingActionCalls.length}
          tone={pendingActionCalls.length > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Unresolved QA flags"
          value={sortedUnresolvedFlags.length}
          tone={sortedUnresolvedFlags.length > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Immediate escalations"
          value={immediateEscalationCount}
          tone={immediateEscalationCount > 0 ? "destructive" : "default"}
        />
        <StatTile label="Calls today" value={callsToday} />
      </div>

      {allClear ? (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex items-center gap-3 py-6">
            <Badge variant="success">All clear</Badge>
            <p className="text-sm text-muted-foreground">
              No pending actions and no unresolved QA flags. Nothing needs attention right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Needs action</CardTitle>
              {pendingActionCalls.length > 0 && (
                <Link href="/action-queue" className="text-xs font-medium text-primary hover:underline">
                  View all ({pendingActionCalls.length})
                </Link>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {pendingActionCalls.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing pending.</p>
              )}
              {pendingActionCalls.slice(0, 3).map((call) => (
                <Link
                  key={call.call_id}
                  href={`/calls/${call.call_id}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-accent/50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{call.client_name ?? call.phone_number}</span>
                    {call.callback_window && (
                      <span className="text-xs text-muted-foreground">
                        Callback — {call.callback_window}
                      </span>
                    )}
                  </div>
                  <Badge variant={urgencyBadgeVariant(call.urgency_level)}>
                    {URGENCY_LEVEL_LABELS[call.urgency_level]}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Needs review</CardTitle>
              {sortedUnresolvedFlags.length > 0 && (
                <Link href="/review-queue" className="text-xs font-medium text-primary hover:underline">
                  View all ({sortedUnresolvedFlags.length})
                </Link>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {sortedUnresolvedFlags.length === 0 && (
                <p className="text-sm text-muted-foreground">No unresolved flags.</p>
              )}
              {sortedUnresolvedFlags.slice(0, 3).map((flag) => (
                <Link
                  key={flag.flag_id}
                  href={flag.calls ? `/calls/${flag.calls.call_id}` : "/review-queue"}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-accent/50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {flag.calls?.client_name ?? flag.calls?.phone_number ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">{FLAG_TYPE_LABELS[flag.flag_type]}</span>
                  </div>
                  {isUrgentFlagType(flag.flag_type) && <Badge variant="destructive">Urgent</Badge>}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calls per day (last {trendWindowDays} days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Known issues</CardTitle>
            <Link href="/known-issues" className="text-xs font-medium text-primary hover:underline">
              View all ({allKnownIssues.length})
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {openIssues.length === 0 && (
              <p className="text-sm text-muted-foreground">No open or monitored issues.</p>
            )}
            {openIssues.slice(0, 3).map((issue) => (
              <Link
                key={issue.issue_id}
                href={`/known-issues/${issue.issue_id}`}
                className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm transition-colors hover:bg-accent/50"
              >
                <span className="line-clamp-1">{issue.title}</span>
                <Badge variant={KNOWN_ISSUE_STATUS_VARIANT[issue.status]}>
                  {KNOWN_ISSUE_STATUS_LABELS[issue.status]}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent calls</CardTitle>
          <Link href="/calls" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recentCalls.length === 0 && <p className="text-sm text-muted-foreground">No calls logged yet.</p>}
          {recentCalls.map((call) => (
            <Link
              key={call.call_id}
              href={`/calls/${call.call_id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-accent/50"
            >
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(call.received_at), "d MMM, HH:mm")}
                </span>
                <span className="font-medium">{call.client_name ?? call.phone_number}</span>
              </div>
              <Badge variant={urgencyBadgeVariant(call.urgency_level)}>
                {URGENCY_LEVEL_LABELS[call.urgency_level]}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
