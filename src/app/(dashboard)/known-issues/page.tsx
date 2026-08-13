import Link from "next/link";

import { Button } from "@/components/ui/button";
import { KnownIssueCard } from "@/components/known-issues/known-issue-card";
import { createClient } from "@/lib/supabase/server";

export default async function KnownIssuesPage() {
  const supabase = await createClient();
  const { data: issues, error } = await supabase
    .from("known_issues")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Known issues</h1>
          <p className="text-sm text-muted-foreground">
            Recurring patterns identified from call reviews, tracked through to a config fix.
          </p>
        </div>
        <Button render={<Link href="/known-issues/new" />} nativeButton={false}>
          New issue
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">Failed to load known issues: {error.message}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {issues?.length === 0 && <p className="text-sm text-muted-foreground">No known issues logged yet.</p>}
        {issues?.map((issue) => (
          <KnownIssueCard key={issue.issue_id} issue={issue} />
        ))}
      </div>
    </div>
  );
}
