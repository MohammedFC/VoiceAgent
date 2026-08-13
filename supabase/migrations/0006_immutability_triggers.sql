-- Audit-trail immutability (spec section 6): raw_transcript and
-- agent_config_changes must be append-only. Enforced with BEFORE
-- UPDATE/DELETE triggers rather than blanket RLS, since RLS cannot
-- cleanly express "this one column is frozen, the rest aren't" -- a
-- trigger gives that precision plus a DB-level guarantee that can't be
-- bypassed by a missing policy.

-- agent_config_changes: whole table is a log. Only the two
-- effectiveness-review fields may ever be updated after insert; no
-- deletes are allowed at all.
create or replace function forbid_config_change_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'agent_config_changes rows are append-only and cannot be deleted';
  end if;

  if new.change_id <> old.change_id
     or new.date <> old.date
     or new.known_issue_id is distinct from old.known_issue_id
     or new.description_of_change <> old.description_of_change
     or new.changed_by <> old.changed_by
     or new.created_at <> old.created_at then
    raise exception 'agent_config_changes core fields are immutable; only effectiveness_reviewed_at/effectiveness_notes may be updated';
  end if;

  return new;
end;
$$;

create trigger trg_config_changes_immutable
before update or delete on agent_config_changes
for each row execute function forbid_config_change_mutation();

-- calls: raw_transcript specifically must never change after creation,
-- and rows can never be deleted. Other fields (urgency, category, etc.)
-- remain correctable by staff -- the spec only calls out raw_transcript
-- as immutable, not the whole row.
create or replace function forbid_transcript_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'calls rows cannot be deleted (audit requirement)';
  end if;

  if new.raw_transcript <> old.raw_transcript then
    raise exception 'raw_transcript is immutable and cannot be modified after creation';
  end if;

  return new;
end;
$$;

create trigger trg_calls_transcript_immutable
before update on calls
for each row execute function forbid_transcript_mutation();

create trigger trg_calls_no_delete
before delete on calls
for each row execute function forbid_transcript_mutation();
