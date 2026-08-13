"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateKnownIssueStatus } from "@/actions/known-issues";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KNOWN_ISSUE_STATUS_LABELS } from "@/lib/labels";
import type { KnownIssueStatus } from "@/lib/types/database";

export function StatusSelect({ issueId, status }: { issueId: string; status: KnownIssueStatus }) {
  const [current, setCurrent] = useState(status);

  async function handleChange(value: string | null) {
    if (!value) return;
    const next = value as KnownIssueStatus;
    const previous = current;
    setCurrent(next);
    const result = await updateKnownIssueStatus(issueId, next);
    if (!result?.success) {
      setCurrent(previous);
      toast.error(result?.error ?? "Failed to update status");
      return;
    }
    toast.success("Status updated");
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(KNOWN_ISSUE_STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
