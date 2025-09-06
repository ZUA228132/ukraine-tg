alter table public.users enable row level security;
alter table public.verifications enable row level security;

drop policy if exists "no-anon-users" on public.users;
drop policy if exists "no-anon-verifications" on public.verifications;

create policy "no-anon-users" on public.users
  for all to anon using (false) with check (false);

create policy "no-anon-verifications" on public.verifications
  for all to anon using (false) with check (false);
