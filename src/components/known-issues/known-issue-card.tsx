import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KNOWN_ISSUE_STATUS_LABELS } from "@/lib/labels";
import type { KnownIssueRow } from "@/lib/types/database";

const STATUS_VARIANT: Record<KnownIssueRow["status"], "outline" | "secondary" | "destructive"> = {
  open: "destructive",
  monitoring: "secondary",
  fix_deployed: "outline",
  closed: "outline",
};

export function KnownIssueCard({ issue }: { issue: KnownIssueRow }) {
  return (
    <Link href={`/known-issues/${issue.issue_id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{issue.title}</CardTitle>
          <Badge variant={STATUS_VARIANT[issue.status]}>{KNOWN_ISSUE_STATUS_LABELS[issue.status]}</Badge>
        </CardHeader>
        {issue.description && (
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">{issue.description}</p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
