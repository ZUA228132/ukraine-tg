create extension if not exists pgcrypto;

create type verification_status as enum ('pending', 'approved', 'rejected');
create type user_role as enum ('user', 'admin');

create table if not exists public.users (
  tg_id         bigint       primary key,
  first_name    text,
  last_name     text,
  username      text,
  role          user_role    not null default 'user',
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now()
);

create table if not exists public.verifications (
  id            uuid          primary key default gen_random_uuid(),
  user_tg_id    bigint        not null references public.users(tg_id) on delete cascade,
  video_path    text          not null,
  doc_path      text          not null,
  status        verification_status not null default 'pending',
  notes         text,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

create index if not exists verifications_user_tg_id_idx on public.verifications(user_tg_id);
create index if not exists verifications_status_idx on public.verifications(status);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at before update on public.users
for each row execute function set_updated_at();

drop trigger if exists verifications_updated_at on public.verifications;
create trigger verifications_updated_at before update on public.verifications
for each row execute function set_updated_at();
