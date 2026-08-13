-- known_issues: a living log of identified patterns, seeded from findings
-- in the companion improvement report (spec section 2.3).

create table known_issues (
  issue_id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  first_seen_call_id uuid references calls (call_id),
  status known_issue_status not null default 'open',
  example_call_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index known_issues_status_idx on known_issues (status);
