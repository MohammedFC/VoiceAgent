import { format, subDays } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/stats/stat-tile";
import { TrendChart, type TrendPoint } from "@/components/stats/trend-chart";
import {
  CALL_REASON_CATEGORY_LABELS,
  FLAG_TYPE_LABELS,
  URGENCY_LEVEL_LABELS,
} from "@/lib/labels";
import type { CallReasonCategory, FlagType, UrgencyLevel } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";

function countBy<T extends string>(items: T[]): Record<T, number> {
  return items.reduce(
    (acc, item) => {
      acc[item] = (acc[item] ?? 0) + 1;
      return acc;
    },
    {} as Record<T, number>,
  );
}

export default async function StatsPage() {
  const supabase = await createClient();

  const [{ data: calls }, { data: flags }] = await Promise.all([
    supabase.from("calls").select("call_reason_category, urgency_level, received_at"),
    supabase.from("review_flags").select("flag_type, resolved"),
  ]);

  const categoryCounts = countBy((calls ?? []).map((c) => c.call_reason_category));
  const urgencyCounts = countBy((calls ?? []).map((c) => c.urgency_level));
  const flagCounts = countBy((flags ?? []).map((f) => f.flag_type));
  const unresolvedFlagCount = (flags ?? []).filter((f) => !f.resolved).length;

  const trendWindowDays = 14;
  const today = new Date();
  const dayBuckets = new Map<string, number>();
  for (let i = trendWindowDays - 1; i >= 0; i--) {
    dayBuckets.set(format(subDays(today, i), "d MMM"), 0);
  }
  for (const call of calls ?? []) {
    const key = format(new Date(call.received_at), "d MMM");
    if (dayBuckets.has(key)) {
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }
  }
  const trendData: TrendPoint[] = Array.from(dayBuckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Summary stats</h1>
        <p className="text-sm text-muted-foreground">Counts across all calls and flags on record.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total calls" value={calls?.length ?? 0} />
        <StatTile label="Total flags raised" value={flags?.length ?? 0} />
        <StatTile label="Unresolved flags" value={unresolvedFlagCount} />
        <StatTile
          label="Immediate escalations"
          value={urgencyCounts.immediate_escalation ?? 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calls per day (last {trendWindowDays} days)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={trendData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {Object.entries(CALL_REASON_CATEGORY_LABELS).map(([value, label]) => (
              <div key={value} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums">{categoryCounts[value as CallReasonCategory] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By urgency</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {Object.entries(URGENCY_LEVEL_LABELS).map(([value, label]) => (
              <div key={value} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums">{urgencyCounts[value as UrgencyLevel] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By flag type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {Object.entries(FLAG_TYPE_LABELS).map(([value, label]) => (
              <div key={value} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums">{flagCounts[value as FlagType] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
