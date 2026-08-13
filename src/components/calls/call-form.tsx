"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createCall } from "@/actions/calls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  CALLER_RELATIONSHIP_LABELS,
  CALL_REASON_CATEGORY_LABELS,
  TRANSCRIPT_COMPLETENESS_LABELS,
  URGENCY_LEVEL_LABELS,
} from "@/lib/labels";
import { callFormSchema, type CallFormValues } from "@/lib/validation/callSchema";

const DEFAULT_VALUES: CallFormValues = {
  phoneNumber: "",
  channel: "Landline",
  callerName: "",
  callerRelationship: undefined,
  clientName: "",
  clientAddress: "",
  addressConfirmed: false,
  callReasonCategory: "other",
  urgencyLevel: "routine",
  specialInstructions: "",
  callbackRequested: false,
  callbackWindow: "",
  transcriptCompleteness: "complete",
  aiSummary: "",
  summaryGrounded: true,
  rawTranscript: "",
};

export function CallForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CallFormValues>({
    resolver: zodResolver(callFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  async function onSubmit(values: CallFormValues) {
    const result = await createCall(values);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save call");
      return;
    }
    toast.success("Call saved");
    router.push(`/calls/${result.callId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Call details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phoneNumber">Phone number *</Label>
            <Input id="phoneNumber" {...register("phoneNumber")} />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="channel">Channel</Label>
            <Input id="channel" {...register("channel")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="callerName">Caller name</Label>
            <Input id="callerName" {...register("callerName")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Caller relationship</Label>
            <Controller
              control={control}
              name="callerRelationship"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CALLER_RELATIONSHIP_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="clientName">Client name</Label>
            <Input id="clientName" {...register("clientName")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="clientAddress">Client address</Label>
            <Input id="clientAddress" {...register("clientAddress")} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Controller
              control={control}
              name="addressConfirmed"
              render={({ field }) => (
                <Checkbox
                  id="addressConfirmed"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="addressConfirmed">Address was read back/confirmed</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Triage</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Call reason category</Label>
            <Controller
              control={control}
              name="callReasonCategory"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CALL_REASON_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Urgency level</Label>
            <Controller
              control={control}
              name="urgencyLevel"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(URGENCY_LEVEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="specialInstructions">Special instructions</Label>
            <Textarea id="specialInstructions" {...register("specialInstructions")} />
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="callbackRequested"
              render={({ field }) => (
                <Checkbox
                  id="callbackRequested"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="callbackRequested">Callback requested</Label>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="callbackWindow">Callback window</Label>
            <Input id="callbackWindow" {...register("callbackWindow")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transcript & summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Transcript completeness</Label>
            <Controller
              control={control}
              name="transcriptCompleteness"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSCRIPT_COMPLETENESS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rawTranscript">
              Raw transcript * (one line per turn, e.g. &quot;Agent: ...&quot; / &quot;Caller:
              ...&quot;)
            </Label>
            <Textarea
              id="rawTranscript"
              rows={10}
              className="font-mono text-sm"
              {...register("rawTranscript")}
            />
            {errors.rawTranscript && (
              <p className="text-sm text-destructive">{errors.rawTranscript.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="aiSummary">AI summary</Label>
            <Textarea id="aiSummary" {...register("aiSummary")} />
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="summaryGrounded"
              render={({ field }) => (
                <Checkbox
                  id="summaryGrounded"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="summaryGrounded">
              Summary is fully traceable to the transcript (uncheck if unsure)
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save call"}
        </Button>
      </div>
    </form>
  );
}
