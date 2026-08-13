"use client";

import { useState } from "react";
import { toast } from "sonner";

import { markEffectivenessReviewed } from "@/actions/config-changes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AgentConfigChangeRow } from "@/lib/types/database";

export function ConfigChangeRow({ change }: { change: AgentConfigChangeRow }) {
  const [reviewed, setReviewed] = useState(Boolean(change.effectiveness_reviewed_at));
  const [notes, setNotes] = useState(change.effectiveness_notes ?? "");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    const result = await markEffectivenessReviewed({
      changeId: change.change_id,
      effectivenessNotes: notes,
    });
    setIsSubmitting(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save");
      return;
    }
    setReviewed(true);
    setOpen(false);
    toast.success("Effectiveness review saved");
  }

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap align-top">{change.date}</TableCell>
      <TableCell className="align-top">{change.changed_by}</TableCell>
      <TableCell className="align-top">{change.description_of_change}</TableCell>
      <TableCell className="align-top">
        {reviewed ? (
          <span className="text-sm text-muted-foreground">
            Reviewed{change.effectiveness_notes ? `: ${change.effectiveness_notes}` : ""}
          </span>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              Mark reviewed for effectiveness
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Effectiveness review</DialogTitle>
              </DialogHeader>
              <Textarea
                placeholder="Did this change fix the issue? Any follow-up needed?"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </TableCell>
    </TableRow>
  );
}
