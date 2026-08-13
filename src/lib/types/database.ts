// Hand-written types mirroring supabase/migrations/*.sql. Regenerate
// with `supabase gen types typescript` once a live project exists, and
// diff against this file to keep them in sync.

export type CallerRelationship = "carer" | "family" | "client" | "other";

export type CallReasonCategory =
  | "cancellation"
  | "safeguarding"
  | "missed_check_in"
  | "medical_emergency"
  | "general_query"
  | "other";

export type UrgencyLevel =
  | "routine"
  | "same_day_action_needed"
  | "immediate_escalation";

export type TranscriptCompleteness = "complete" | "partial" | "failed";

export type FlagType =
  | "incomplete_transcript"
  | "ambiguous_safety_answer"
  | "low_confidence_address"
  | "safeguarding_keyword"
  | "agent_loop_detected"
  | "possible_fabricated_summary"
  | "human_requested";

export type KnownIssueStatus = "open" | "fix_deployed" | "monitoring" | "closed";

export const URGENT_FLAG_TYPES: readonly FlagType[] = [
  "ambiguous_safety_answer",
  "safeguarding_keyword",
  "possible_fabricated_summary",
];

// These are `type` aliases, not `interface`s, on purpose: TypeScript only
// treats object-literal type aliases as satisfying `Record<string, unknown>`
// (an implicit index signature) -- `interface` declarations don't, which
// silently breaks @supabase/postgrest-js's GenericTable/GenericSchema
// constraints and makes every query resolve to `never`.
export type CallRow = {
  call_id: string;
  received_at: string;
  phone_number: string;
  channel: string;
  caller_name: string | null;
  caller_relationship: CallerRelationship | null;
  client_name: string | null;
  client_address: string | null;
  address_confirmed: boolean;
  call_reason_category: CallReasonCategory;
  urgency_level: UrgencyLevel;
  special_instructions: string | null;
  callback_requested: boolean;
  callback_window: string | null;
  transcript_completeness: TranscriptCompleteness;
  ai_summary: string | null;
  summary_grounded: boolean;
  raw_transcript: string;
  created_by: string | null;
  created_at: string;
};

export type CallInsert = Omit<
  CallRow,
  "call_id" | "created_at" | "received_at" | "created_by"
> &
  Partial<Pick<CallRow, "call_id" | "created_at" | "received_at" | "created_by">>;

export type ReviewFlagRow = {
  flag_id: string;
  call_id: string;
  flag_type: FlagType;
  raised_at: string;
  reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  resolved: boolean;
};

export type ReviewFlagInsert = Omit<
  ReviewFlagRow,
  "flag_id" | "raised_at" | "reviewed_by" | "reviewed_at" | "reviewer_notes" | "resolved"
> &
  Partial<
    Pick<
      ReviewFlagRow,
      "flag_id" | "raised_at" | "reviewed_by" | "reviewed_at" | "reviewer_notes" | "resolved"
    >
  >;

export type KnownIssueRow = {
  issue_id: string;
  title: string;
  description: string | null;
  first_seen_call_id: string | null;
  status: KnownIssueStatus;
  example_call_ids: string[];
  created_at: string;
  updated_at: string;
};

export type KnownIssueInsert = Omit<
  KnownIssueRow,
  "issue_id" | "created_at" | "updated_at" | "status" | "example_call_ids"
> &
  Partial<
    Pick<KnownIssueRow, "issue_id" | "created_at" | "updated_at" | "status" | "example_call_ids">
  >;

export type AgentConfigChangeRow = {
  change_id: string;
  date: string;
  known_issue_id: string | null;
  description_of_change: string;
  changed_by: string;
  effectiveness_reviewed_at: string | null;
  effectiveness_notes: string | null;
  created_at: string;
};

export type AgentConfigChangeInsert = Omit<
  AgentConfigChangeRow,
  "change_id" | "created_at" | "date" | "effectiveness_reviewed_at" | "effectiveness_notes"
> &
  Partial<
    Pick<
      AgentConfigChangeRow,
      "change_id" | "created_at" | "date" | "effectiveness_reviewed_at" | "effectiveness_notes"
    >
  >;

// `Relationships` mirrors the FKs declared in supabase/migrations/*.sql.
// Required by @supabase/postgrest-js's GenericTable/GenericSchema shape
// (see node_modules/@supabase/postgrest-js/src/types/common/common.ts) --
// without it, every `.from(...)` query resolves to `never`.
export type Database = {
  public: {
    Tables: {
      calls: {
        Row: CallRow;
        Insert: CallInsert;
        Update: Partial<CallRow>;
        Relationships: [];
      };
      review_flags: {
        Row: ReviewFlagRow;
        Insert: ReviewFlagInsert;
        Update: Partial<ReviewFlagRow>;
        Relationships: [
          {
            foreignKeyName: "review_flags_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["call_id"];
          },
        ];
      };
      known_issues: {
        Row: KnownIssueRow;
        Insert: KnownIssueInsert;
        Update: Partial<KnownIssueRow>;
        Relationships: [
          {
            foreignKeyName: "known_issues_first_seen_call_id_fkey";
            columns: ["first_seen_call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["call_id"];
          },
        ];
      };
      agent_config_changes: {
        Row: AgentConfigChangeRow;
        Insert: AgentConfigChangeInsert;
        Update: Partial<AgentConfigChangeRow>;
        Relationships: [
          {
            foreignKeyName: "agent_config_changes_known_issue_id_fkey";
            columns: ["known_issue_id"];
            isOneToOne: false;
            referencedRelation: "known_issues";
            referencedColumns: ["issue_id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
