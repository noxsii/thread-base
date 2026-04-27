-- public.users mirrors auth.users — every signUp creates a row here too
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- RLS: User darf nur seine eigene Zeile lesen / aendern
create policy "users_select_own"
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "users_update_own"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Inserts: nur via Trigger (security definer); keine policy fuer authenticated
-- Deletes: nur via Cascade von auth.users; keine policy fuer authenticated

-- Trigger: bei jedem neuen auth.users-Eintrag automatisch eine public.users-Zeile anlegen
create function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
  begin
    insert into public.users (id) values (new.id);
    return new;
  end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();