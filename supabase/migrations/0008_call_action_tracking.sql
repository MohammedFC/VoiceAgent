-- Action tracking for calls that need real-world follow-up (a callback,
-- a same-day response, an immediate escalation) -- distinct from
-- review_flags, which tracks whether Kath behaved correctly, not whether
-- the actual care follow-up got done. "Needs action" itself isn't stored;
-- it's derived from callback_requested/urgency_level (see
-- src/lib/severity.ts::callNeedsAction) so it can never drift out of sync
-- with the data that already determines it.

alter table calls
  add column action_completed_at timestamptz,
  add column action_completed_by text,
  add column action_notes text;

create index calls_action_pending_idx on calls (received_at)
  where action_completed_at is null;
