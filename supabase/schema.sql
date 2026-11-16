-- Po Notestack: notes table with per-user row-level security
create table if not exists public.notes (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated bigint not null,
  deleted boolean not null default false,
  synced_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint notes_size check (octet_length(data::text) < 5000000)
);
alter table public.notes enable row level security;
create policy "notes_select_own" on public.notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "notes_insert_own" on public.notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notes_update_own" on public.notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notes_delete_own" on public.notes for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.notes from anon;
grant select, insert, update, delete on public.notes to authenticated;

-- server-side change clock used by sync
create or replace function public.notes_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.synced_at := now(); return new; end $$;
drop trigger if exists notes_touch on public.notes;
create trigger notes_touch before insert or update on public.notes for each row execute function public.notes_touch();
create index if not exists notes_user_synced on public.notes (user_id, synced_at);
