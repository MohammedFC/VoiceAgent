import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfigChangeRow } from "@/components/config-changes/config-change-row";
import { createClient } from "@/lib/supabase/server";

export default async function ConfigChangesPage() {
  const supabase = await createClient();
  const { data: changes, error } = await supabase
    .from("agent_config_changes")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Config changes</h1>
          <p className="text-sm text-muted-foreground">
            Changelog of fixes made to Kath&apos;s prompt/config. Append-only audit record.
          </p>
        </div>
        <Button render={<Link href="/config-changes/new" />} nativeButton={false}>
          Log change
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">Failed to load config changes: {error.message}</p>}

      <p className="text-xs text-muted-foreground md:hidden">Swipe the table sideways to see more columns →</p>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Changed by</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Effectiveness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No config changes logged yet.
                </TableCell>
              </TableRow>
            )}
            {changes?.map((change) => (
              <ConfigChangeRow key={change.change_id} change={change} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
