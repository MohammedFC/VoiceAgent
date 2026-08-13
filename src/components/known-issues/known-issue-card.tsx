import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KNOWN_ISSUE_STATUS_LABELS } from "@/lib/labels";
import { KNOWN_ISSUE_STATUS_VARIANT } from "@/lib/severity";
import type { KnownIssueRow } from "@/lib/types/database";

export function KnownIssueCard({ issue }: { issue: KnownIssueRow }) {
  return (
    <Link href={`/known-issues/${issue.issue_id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{issue.title}</CardTitle>
          <Badge variant={KNOWN_ISSUE_STATUS_VARIANT[issue.status]}>
            {KNOWN_ISSUE_STATUS_LABELS[issue.status]}
          </Badge>
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
