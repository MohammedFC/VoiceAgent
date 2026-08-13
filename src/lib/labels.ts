import type {
  CallReasonCategory,
  CallerRelationship,
  FlagType,
  KnownIssueStatus,
  TranscriptCompleteness,
  UrgencyLevel,
} from "@/lib/types/database";

export const CALL_REASON_CATEGORY_LABELS: Record<CallReasonCategory, string> = {
  cancellation: "Cancellation",
  safeguarding: "Safeguarding",
  missed_check_in: "Missed check-in",
  medical_emergency: "Medical emergency",
  general_query: "General query",
  other: "Other",
};

export const URGENCY_LEVEL_LABELS: Record<UrgencyLevel, string> = {
  routine: "Routine",
  same_day_action_needed: "Same-day action needed",
  immediate_escalation: "Immediate escalation",
};

export const CALLER_RELATIONSHIP_LABELS: Record<CallerRelationship, string> = {
  carer: "Carer",
  family: "Family",
  client: "Client",
  other: "Other",
};

export const TRANSCRIPT_COMPLETENESS_LABELS: Record<TranscriptCompleteness, string> = {
  complete: "Complete",
  partial: "Partial",
  failed: "Failed",
};

export const FLAG_TYPE_LABELS: Record<FlagType, string> = {
  incomplete_transcript: "Incomplete transcript",
  ambiguous_safety_answer: "Ambiguous safety answer",
  low_confidence_address: "Low-confidence address",
  safeguarding_keyword: "Safeguarding keyword",
  agent_loop_detected: "Agent loop detected",
  possible_fabricated_summary: "Possible fabricated summary",
  human_requested: "Human requested",
};

export const KNOWN_ISSUE_STATUS_LABELS: Record<KnownIssueStatus, string> = {
  open: "Open",
  fix_deployed: "Fix deployed",
  monitoring: "Monitoring",
  closed: "Closed",
};
