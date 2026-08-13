-- calls: one row per out-of-hours call, the structured version of the
-- current email records (spec section 2.1).

create table calls (
  call_id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  phone_number text not null,
  channel text not null default 'Landline',
  caller_name text,
  caller_relationship caller_relationship,
  client_name text,
  client_address text,
  address_confirmed boolean not null default false,
  call_reason_category call_reason_category not null default 'other',
  urgency_level urgency_level not null default 'routine',
  special_instructions text,
  callback_requested boolean not null default false,
  callback_window text,
  transcript_completeness transcript_completeness not null default 'complete',
  ai_summary text,
  summary_grounded boolean not null default true,
  raw_transcript text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index calls_received_at_idx on calls (received_at desc);
create index calls_urgency_idx on calls (urgency_level);
create index calls_category_idx on calls (call_reason_category);
