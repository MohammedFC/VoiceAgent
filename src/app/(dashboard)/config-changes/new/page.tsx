"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { createConfigChange } from "@/actions/config-changes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { KnownIssueRow } from "@/lib/types/database";

const NONE_VALUE = "none";

export default function NewConfigChangePage() {
  const searchParams = useSearchParams();
  const [knownIssues, setKnownIssues] = useState<KnownIssueRow[]>([]);
  const [knownIssueId, setKnownIssueId] = useState(searchParams.get("issueId") ?? NONE_VALUE);
  const [description, setDescription] = useState("");
  const [changedBy, setChangedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("known_issues")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setKnownIssues(data ?? []));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await createConfigChange({
      knownIssueId: knownIssueId === NONE_VALUE ? undefined : knownIssueId,
      descriptionOfChange: description,
      changedBy,
    });
    setIsSubmitting(false);
    if (result && !result.success) {
      toast.error(result.error ?? "Failed to log config change");
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Log a config change</h1>
        <p className="text-sm text-muted-foreground">
          Record an actual fix made to Kath&apos;s prompt/config. This is an append-only audit
          record.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label>Related known issue</Label>
              <Select
                value={knownIssueId}
                onValueChange={(v) => setKnownIssueId(v ?? NONE_VALUE)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {knownIssues.map((issue) => (
                    <SelectItem key={issue.issue_id} value={issue.issue_id}>
                      {issue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description of change *</Label>
              <Textarea
                id="description"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="changedBy">Changed by *</Label>
              <Input id="changedBy" required value={changedBy} onChange={(e) => setChangedBy(e.target.value)} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="self-start">
              {isSubmitting ? "Saving..." : "Log change"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
