import { z } from "zod";

const CALLER_RELATIONSHIP_VALUES = ["carer", "family", "client", "other"] as const;
const CALL_REASON_CATEGORY_VALUES = [
  "cancellation",
  "safeguarding",
  "missed_check_in",
  "medical_emergency",
  "general_query",
  "other",
] as const;
const URGENCY_LEVEL_VALUES = [
  "routine",
  "same_day_action_needed",
  "immediate_escalation",
] as const;
const TRANSCRIPT_COMPLETENESS_VALUES = ["complete", "partial", "failed"] as const;

// Full structured schema used by the manual "new call" entry form
// (spec section 2.1 / build order step 1).
export const callFormSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  channel: z.string().min(1).default("Landline"),
  callerName: z.string().optional(),
  callerRelationship: z.enum(CALLER_RELATIONSHIP_VALUES).optional(),
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  addressConfirmed: z.boolean().default(false),
  callReasonCategory: z.enum(CALL_REASON_CATEGORY_VALUES).default("other"),
  urgencyLevel: z.enum(URGENCY_LEVEL_VALUES).default("routine"),
  specialInstructions: z.string().optional(),
  callbackRequested: z.boolean().default(false),
  callbackWindow: z.string().optional(),
  transcriptCompleteness: z.enum(TRANSCRIPT_COMPLETENESS_VALUES).default("complete"),
  aiSummary: z.string().optional(),
  summaryGrounded: z.boolean().default(true),
  rawTranscript: z.string().min(1, "Transcript is required"),
});

// Use the input (pre-default) type here, not z.infer's output type --
// react-hook-form + zodResolver hold form state in the schema's input
// shape (fields with .default() are optional until parsed), and
// safeParse() in the server action below applies the defaults.
export type CallFormValues = z.input<typeof callFormSchema>;

// Shape of the existing 4-part email template (Caller Name / Phone
// Number / Reason of Call / Transcript), accepted by the ingestion
// stub route so a future email-parsing worker has a stable contract
// to POST to (spec section 3).
export const ingestPayloadSchema = z.object({
  callerName: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  reasonOfCall: z.string().optional(),
  transcript: z.string().min(1, "Transcript is required"),
});

export type IngestPayload = z.infer<typeof ingestPayloadSchema>;
