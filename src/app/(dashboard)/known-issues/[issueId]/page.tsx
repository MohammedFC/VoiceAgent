import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusSelect } from "@/components/known-issues/status-select";
import { createClient } from "@/lib/supabase/server";

interface KnownIssueDetailPageProps {
  params: Promise<{ issueId: string }>;
}

export default async function KnownIssueDetailPage({ params }: KnownIssueDetailPageProps) {
  const { issueId } = await params;
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("known_issues")
    .select("*")
    .eq("issue_id", issueId)
    .single();

  if (!issue) {
    notFound();
  }

  const exampleCallIds = issue.example_call_ids ?? [];
  const { data: exampleCalls } =
    exampleCallIds.length > 0
      ? await supabase
          .from("calls")
          .select("call_id, received_at, phone_number, client_name")
          .in("call_id", exampleCallIds)
      : { data: [] };

  const { data: configChanges } = await supabase
    .from("agent_config_changes")
    .select("*")
    .eq("known_issue_id", issueId)
    .order("date", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{issue.title}</h1>
          {issue.description && <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>}
        </div>
        <StatusSelect issueId={issue.issue_id} status={issue.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Example calls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(!exampleCalls || exampleCalls.length === 0) && (
            <p className="text-sm text-muted-foreground">No example calls linked.</p>
          )}
          {exampleCalls?.map((call) => (
            <Link key={call.call_id} href={`/calls/${call.call_id}`} className="text-sm underline">
              {format(new Date(call.received_at), "d MMM yyyy, HH:mm")} — {call.client_name ?? call.phone_number}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Config changes</CardTitle>
          <Button
            render={<Link href={`/config-changes/new?issueId=${issue.issue_id}`} />}
            size="sm"
            variant="outline"
          >
            Log config change
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(!configChanges || configChanges.length === 0) && (
            <p className="text-sm text-muted-foreground">No config changes logged for this issue yet.</p>
          )}
          {configChanges?.map((change) => (
            <div key={change.change_id} className="rounded-md border p-3 text-sm">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{change.date}</span>
                <span>{change.changed_by}</span>
              </div>
              <p className="mt-1">{change.description_of_change}</p>
              {change.effectiveness_reviewed_at ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Effectiveness reviewed {change.effectiveness_reviewed_at}
                  {change.effectiveness_notes ? `: ${change.effectiveness_notes}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Effectiveness not yet reviewed.</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
