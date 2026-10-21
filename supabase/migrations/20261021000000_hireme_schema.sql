-- HireMe (real version): run this once in Supabase → SQL Editor → New query → Run.
--
-- Privacy is enforced here, in the database (row level security), not only by the app's screens:
-- - Contact details (full name, email, phone, address, LinkedIn) are in profile_private: only their owner
--   can read them, except employers' (a company's contact details are public on its page).
-- - Job seekers appear to everyone else by first name only (profiles.display_name).
-- - CVs (talents) are visible to their owner, employers and recruiters (the Pool); never to other job seekers.
-- - Applications, conversations and messages only to the two sides involved; notifications, saved
--   items and follows only to their owner.
-- - Nobody can make themselves a recruiter: that role is given by the admin (the app's /admin page).
--
-- Most rows keep the app's object as-is in `data` (jsonb), with the columns the rules need beside it.

-- ─── Accounts ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'SEEKER' check (role in ('SEEKER', 'EMPLOYER', 'RECRUITER')),
  display_name text not null default '',      -- job seekers: first name only; others: full name
  title text not null default '',
  company text not null default '',
  avatar_color text not null default '#8A1538',
  city text not null default '',
  country text not null default 'IQ',
  bio text not null default '',
  photo_id text not null default '',
  onboarded boolean not null default false,   -- false until they've chosen job seeker or employer
  created_at timestamptz not null default now()
);

create table if not exists public.profile_private (
  id uuid primary key references public.profiles on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  linkedin text not null default ''
);

-- The signed-in user's role (security definer: usable inside the rules below without recursion)
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- A new sign-up gets its profile. The sign-up form sends name, role (job seeker or employer), title and
-- company; Google sign-ups send only a name and choose their role next (onboarded = false).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := trim(coalesce(meta->>'name', meta->>'full_name', ''));
  wanted text := coalesce(meta->>'role', '');
  chosen text := case when wanted in ('SEEKER', 'EMPLOYER') then wanted else 'SEEKER' end;
  colors text[] := array['#8A1538', '#1D4ED8', '#047857', '#B45309', '#7C3AED', '#0E7490', '#BE185D', '#4D7C0F'];
begin
  insert into public.profiles (id, role, display_name, title, company, avatar_color, onboarded)
  values (
    new.id,
    chosen,
    case when chosen = 'SEEKER' then split_part(full_name, ' ', 1) else full_name end,
    coalesce(meta->>'title', ''),
    coalesce(meta->>'company', ''),
    colors[1 + floor(random() * array_length(colors, 1))::int],
    wanted in ('SEEKER', 'EMPLOYER')
  );
  insert into public.profile_private (id, full_name, email) values (new.id, full_name, coalesce(new.email, ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Roles can't be changed by users, except choosing job seeker or employer once (onboarding).
-- The admin (service role) can give any role.
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if new.role <> old.role and not (old.onboarded = false and new.role in ('SEEKER', 'EMPLOYER')) then
    raise exception 'Your role can only be changed by HireMe.';
  end if;
  if old.onboarded and not new.onboarded then new.onboarded := true; end if;
  return new;
end $$;

drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

drop policy if exists "profiles: signed-in users see everyone's public part" on public.profiles;
create policy "profiles: signed-in users see everyone's public part" on public.profiles
  for select to authenticated using (true);
drop policy if exists "profiles: visitors see companies" on public.profiles;
create policy "profiles: visitors see companies" on public.profiles
  for select to anon using (role = 'EMPLOYER');
drop policy if exists "profiles: owner edits" on public.profiles;
create policy "profiles: owner edits" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "private: owner, or a company's public contact" on public.profile_private;
create policy "private: owner, or a company's public contact" on public.profile_private
  for select to anon, authenticated using (
    id = auth.uid() or exists (select 1 from public.profiles p where p.id = profile_private.id and p.role = 'EMPLOYER')
  );
drop policy if exists "private: owner edits" on public.profile_private;
create policy "private: owner edits" on public.profile_private
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ─── CVs, jobs and everything around them ────────────────────────────────────

create table if not exists public.talents (
  id text primary key,
  user_id uuid not null unique references public.profiles on delete cascade,
  data jsonb not null
);

create table if not exists public.jobs (
  id text primary key,
  employer_id uuid not null references public.profiles on delete cascade,
  data jsonb not null
);

create table if not exists public.applications (
  id text primary key,
  job_id text not null references public.jobs on delete cascade,
  seeker_id uuid not null references public.profiles on delete cascade,
  data jsonb not null
);

create table if not exists public.conversations (
  id text primary key,
  employer_id uuid not null references public.profiles on delete cascade,
  seeker_id uuid not null references public.profiles on delete cascade,
  data jsonb not null
);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  data jsonb not null
);

create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  job_id text not null references public.jobs on delete cascade,
  data jsonb not null
);

create table if not exists public.saved_jobs (
  id text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  data jsonb not null
);

create table if not exists public.saved_talents (
  id text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  data jsonb not null
);

create table if not exists public.follows (
  id text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  employer_id uuid not null references public.profiles on delete cascade,
  data jsonb not null
);

alter table public.talents enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.saved_talents enable row level security;
alter table public.follows enable row level security;

-- CVs: the job seeker, employers and recruiters (the Pool)
drop policy if exists "talents: read" on public.talents;
create policy "talents: read" on public.talents for select to authenticated
  using (user_id = auth.uid() or public.my_role() in ('EMPLOYER', 'RECRUITER'));
drop policy if exists "talents: owner writes" on public.talents;
create policy "talents: owner writes" on public.talents for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.my_role() = 'SEEKER');

-- Job listings: everyone, also visitors who aren't signed in; employers write their own
drop policy if exists "jobs: read" on public.jobs;
create policy "jobs: read" on public.jobs for select to anon, authenticated using (true);
drop policy if exists "jobs: employer writes" on public.jobs;
create policy "jobs: employer writes" on public.jobs for all to authenticated
  using (employer_id = auth.uid()) with check (employer_id = auth.uid() and public.my_role() = 'EMPLOYER');

-- Applications: the job seeker and the job's employer
drop policy if exists "applications: read" on public.applications;
create policy "applications: read" on public.applications for select to authenticated using (
  seeker_id = auth.uid() or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
);
drop policy if exists "applications: seeker applies" on public.applications;
create policy "applications: seeker applies" on public.applications for insert to authenticated
  with check (seeker_id = auth.uid() and public.my_role() = 'SEEKER');
drop policy if exists "applications: both sides update" on public.applications;
create policy "applications: both sides update" on public.applications for update to authenticated using (
  seeker_id = auth.uid() or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
);
drop policy if exists "applications: seeker withdraws" on public.applications;
create policy "applications: seeker withdraws" on public.applications for delete to authenticated
  using (seeker_id = auth.uid());

-- Conversations and messages: the two sides only
drop policy if exists "conversations: participants" on public.conversations;
create policy "conversations: participants" on public.conversations for select to authenticated
  using (employer_id = auth.uid() or seeker_id = auth.uid());
drop policy if exists "conversations: employer starts" on public.conversations;
create policy "conversations: employer starts" on public.conversations for insert to authenticated
  with check (employer_id = auth.uid() and public.my_role() = 'EMPLOYER');
drop policy if exists "conversations: participants update" on public.conversations;
create policy "conversations: participants update" on public.conversations for update to authenticated
  using (employer_id = auth.uid() or seeker_id = auth.uid());

drop policy if exists "messages: participants read" on public.messages;
create policy "messages: participants read" on public.messages for select to authenticated using (
  exists (select 1 from public.conversations c where c.id = conversation_id and (c.employer_id = auth.uid() or c.seeker_id = auth.uid()))
);
drop policy if exists "messages: participants send" on public.messages;
create policy "messages: participants send" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (select 1 from public.conversations c where c.id = conversation_id and (c.employer_id = auth.uid() or c.seeker_id = auth.uid()))
);
drop policy if exists "messages: participants mark read" on public.messages;
create policy "messages: participants mark read" on public.messages for update to authenticated using (
  exists (select 1 from public.conversations c where c.id = conversation_id and (c.employer_id = auth.uid() or c.seeker_id = auth.uid()))
);

-- Notifications: their owner; an employer may notify job seekers about their own job
drop policy if exists "notifications: owner" on public.notifications;
create policy "notifications: owner" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications: owner updates" on public.notifications;
create policy "notifications: owner updates" on public.notifications for update to authenticated using (user_id = auth.uid());
drop policy if exists "notifications: owner deletes" on public.notifications;
create policy "notifications: owner deletes" on public.notifications for delete to authenticated using (user_id = auth.uid());
drop policy if exists "notifications: create" on public.notifications;
create policy "notifications: create" on public.notifications for insert to authenticated with check (
  user_id = auth.uid() or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
);

-- Saved items and follows: their owner only
drop policy if exists "saved_jobs: owner" on public.saved_jobs;
create policy "saved_jobs: owner" on public.saved_jobs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "saved_talents: owner" on public.saved_talents;
create policy "saved_talents: owner" on public.saved_talents for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "follows: owner" on public.follows;
create policy "follows: owner" on public.follows for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- New messages, notifications and applications arrive without reloading
do $$ begin
  alter publication supabase_realtime add table public.messages, public.notifications, public.applications, public.conversations;
exception when duplicate_object then null; end $$;

-- ─── Files (photos, certificates) ────────────────────────────────────────────
-- Stored as files/<user id>/<file id>; only the owner uploads or deletes; signed-in users can open them
-- (employers see CV photos and certificates in the Pool).

insert into storage.buckets (id, name, public) values ('files', 'files', false) on conflict (id) do nothing;

drop policy if exists "files: signed-in read" on storage.objects;
create policy "files: signed-in read" on storage.objects for select to authenticated using (bucket_id = 'files');
drop policy if exists "files: owner uploads" on storage.objects;
create policy "files: owner uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "files: owner updates" on storage.objects;
create policy "files: owner updates" on storage.objects for update to authenticated
  using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "files: owner deletes" on storage.objects;
create policy "files: owner deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);
