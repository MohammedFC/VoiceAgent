-- Enum types for the Out-of-Hours Call Log & Review Dashboard.
-- Values are snake_case; the application layer maps these to the
-- spec's human-readable labels for display.

create type caller_relationship as enum ('carer', 'family', 'client', 'other');

create type call_reason_category as enum (
  'cancellation',
  'safeguarding',
  'missed_check_in',
  'medical_emergency',
  'general_query',
  'other'
);

create type urgency_level as enum (
  'routine',
  'same_day_action_needed',
  'immediate_escalation'
);

create type transcript_completeness as enum ('complete', 'partial', 'failed');

create type flag_type as enum (
  'incomplete_transcript',
  'ambiguous_safety_answer',
  'low_confidence_address',
  'safeguarding_keyword',
  'agent_loop_detected',
  'possible_fabricated_summary',
  'human_requested'
);

create type known_issue_status as enum ('open', 'fix_deployed', 'monitoring', 'closed');
