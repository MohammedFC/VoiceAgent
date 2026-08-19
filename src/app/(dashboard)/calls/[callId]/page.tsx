import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CallActionPanel } from "@/components/calls/call-action-panel";
import { TranscriptView } from "@/components/calls/transcript-view";
import { FlagReviewPanel } from "@/components/review/flag-review-panel";
import {
  CALLER_RELATIONSHIP_LABELS,
  CALL_REASON_CATEGORY_LABELS,
  TRANSCRIPT_COMPLETENESS_LABELS,
  URGENCY_LEVEL_LABELS,
} from "@/lib/labels";
import { callNeedsAction, urgencyBadgeVariant } from "@/lib/severity";
import { createClient } from "@/lib/supabase/server";

interface CallDetailPageProps {
  params: Promise<{ callId: string }>;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value ?? "—"}</span>
    </div>
  );
}

export default async function CallDetailPage({ params }: CallDetailPageProps) {
  const { callId } = await params;
  const supabase = await createClient();

  const { data: call } = await supabase
    .from("calls")
    .select("*, review_flags(*)")
    .eq("call_id", callId)
    .single();

  if (!call) {
    notFound();
  }

  const flags = [...call.review_flags].sort(
    (a, b) => Number(a.resolved) - Number(b.resolved),
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/calls"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to calls
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{call.client_name ?? call.phone_number}</h1>
          <p className="text-sm text-muted-foreground">
            Received {format(new Date(call.received_at), "d MMMM yyyy, HH:mm")} via {call.channel}
          </p>
        </div>
        <Badge variant={urgencyBadgeVariant(call.urgency_level)}>
          {URGENCY_LEVEL_LABELS[call.urgency_level]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flags ({flags.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {flags.length === 0 && <p className="text-sm text-muted-foreground">No flags raised.</p>}
          {flags.map((flag) => (
            <FlagReviewPanel key={flag.flag_id} flag={flag} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <TranscriptView transcript={call.raw_transcript} />
        </CardContent>
      </Card>

      {(callNeedsAction(call) || call.action_completed_at) && (
        <Card>
          <CardHeader>
            <CardTitle>Follow-up action</CardTitle>
          </CardHeader>
          <CardContent>
            <CallActionPanel call={call} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Call details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Phone number" value={call.phone_number} />
          <Field label="Channel" value={call.channel} />
          <Field label="Caller name" value={call.caller_name} />
          <Field
            label="Caller relationship"
            value={call.caller_relationship ? CALLER_RELATIONSHIP_LABELS[call.caller_relationship] : undefined}
          />
          <Field label="Client name" value={call.client_name} />
          <Field label="Client address" value={call.client_address} />
          <Field label="Address confirmed" value={call.address_confirmed ? "Yes" : "No"} />
          <Field label="Category" value={CALL_REASON_CATEGORY_LABELS[call.call_reason_category]} />
          <Field label="Callback requested" value={call.callback_requested ? "Yes" : "No"} />
          <Field label="Callback window" value={call.callback_window} />
          <Field
            label="Transcript completeness"
            value={TRANSCRIPT_COMPLETENESS_LABELS[call.transcript_completeness]}
          />
          <Field label="Summary grounded" value={call.summary_grounded ? "Yes" : "No"} />
        </CardContent>
        {call.special_instructions && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <Field label="Special instructions" value={call.special_instructions} />
          </CardContent>
        )}
      </Card>

      {call.ai_summary && (
        <Card>
          <CardHeader>
            <CardTitle>AI summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{call.ai_summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
