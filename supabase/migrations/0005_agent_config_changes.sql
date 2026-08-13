-- agent_config_changes: changelog of actual fixes made to the voice
-- agent's prompt/config (spec section 2.4). Append-only audit record.

create table agent_config_changes (
  change_id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  known_issue_id uuid references known_issues (issue_id),
  description_of_change text not null,
  changed_by text not null,
  effectiveness_reviewed_at date,
  effectiveness_notes text,
  created_at timestamptz not null default now()
);

create index agent_config_changes_known_issue_idx on agent_config_changes (known_issue_id);
