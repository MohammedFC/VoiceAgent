"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createKnownIssue } from "@/actions/known-issues";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewKnownIssuePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [firstSeenCallId, setFirstSeenCallId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await createKnownIssue({
      title,
      description: description || undefined,
      firstSeenCallId: firstSeenCallId || undefined,
    });
    setIsSubmitting(false);
    if (result && !result.success) {
      toast.error(result.error ?? "Failed to create known issue");
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">New known issue</h1>
        <p className="text-sm text-muted-foreground">
          Log a recurring pattern surfaced from call reviews, e.g. from the companion improvement
          report.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstSeenCallId">First seen call ID (optional)</Label>
              <Input
                id="firstSeenCallId"
                placeholder="UUID of the call this was first spotted on"
                value={firstSeenCallId}
                onChange={(e) => setFirstSeenCallId(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="self-start">
              {isSubmitting ? "Saving..." : "Create known issue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
