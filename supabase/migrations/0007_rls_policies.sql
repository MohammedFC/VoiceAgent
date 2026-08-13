-- Access control (spec section 6): restricted to authorised staff only.
-- There are no role tiers in v1 -- every Supabase Auth user is staff,
-- since accounts are created manually by an admin (no public signup,
-- see the app's auth setup). Anonymous requests get nothing.
--
-- No delete policies are defined anywhere: deletes are refused by RLS's
-- default-deny in addition to the immutability triggers in migration
-- 0006 (defense in depth).

alter table calls enable row level security;
alter table review_flags enable row level security;
alter table known_issues enable row level security;
alter table agent_config_changes enable row level security;

create policy "staff_select_calls" on calls
  for select to authenticated using (true);
create policy "staff_insert_calls" on calls
  for insert to authenticated with check (true);
create policy "staff_update_calls" on calls
  for update to authenticated using (true) with check (true);

create policy "staff_select_flags" on review_flags
  for select to authenticated using (true);
create policy "staff_insert_flags" on review_flags
  for insert to authenticated with check (true);
create policy "staff_update_flags" on review_flags
  for update to authenticated using (true) with check (true);

create policy "staff_select_issues" on known_issues
  for select to authenticated using (true);
create policy "staff_insert_issues" on known_issues
  for insert to authenticated with check (true);
create policy "staff_update_issues" on known_issues
  for update to authenticated using (true) with check (true);

create policy "staff_select_config_changes" on agent_config_changes
  for select to authenticated using (true);
create policy "staff_insert_config_changes" on agent_config_changes
  for insert to authenticated with check (true);
-- Update policy exists (needed for effectiveness fields); the trigger
-- in migration 0006 restricts which columns can actually change.
create policy "staff_update_config_changes" on agent_config_changes
  for update to authenticated using (true) with check (true);
