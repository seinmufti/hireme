-- Security pass:
-- 1. Files: only their owner, approved employers/recruiters (job seekers' CV files) and anyone signed in
--    (companies' files, e.g. logos) can open them. Job seekers no longer see each other's files.
-- 2. Employers need HireMe's approval (like recruiters) before they see the Pool or post jobs.
-- 3. Rows can only change the way the app changes them: an employer sets an application's status, the
--    recipient marks a message read, and so on. The ids inside `data` always match the row's columns,
--    so nobody can make a message look like it came from someone else.
-- 4. (In the app: employers only see a job seeker's birth year and month, not the exact date.)
-- 5. AI features have a daily limit per user.

-- ─── 2. Employer approval ────────────────────────────────────────────────────

alter table public.profiles add column if not exists approved boolean not null default false;
-- Everyone already here keeps working, except employers, who wait for approval like new ones
update public.profiles set approved = (role <> 'EMPLOYER');

-- Approved employers and recruiters: the ones who may see job seekers' CVs
create or replace function public.can_see_cvs() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('EMPLOYER', 'RECRUITER') and approved)
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := trim(coalesce(meta->>'name', meta->>'full_name', ''));
  wanted text := coalesce(meta->>'role', '');
  chosen text := case when wanted in ('SEEKER', 'EMPLOYER') then wanted else 'SEEKER' end;
  colors text[] := array['#8A1538', '#1D4ED8', '#047857', '#B45309', '#7C3AED', '#0E7490', '#BE185D', '#4D7C0F'];
begin
  insert into public.profiles (id, role, display_name, title, company, avatar_color, onboarded, approved)
  values (
    new.id,
    chosen,
    case when chosen = 'SEEKER' then split_part(full_name, ' ', 1) else full_name end,
    coalesce(meta->>'title', ''),
    coalesce(meta->>'company', ''),
    colors[1 + floor(random() * array_length(colors, 1))::int],
    wanted in ('SEEKER', 'EMPLOYER'),
    chosen = 'SEEKER'
  );
  insert into public.profile_private (id, full_name, email) values (new.id, full_name, coalesce(new.email, ''));
  return new;
end $$;

-- Users can't change their role (except choosing once while onboarding) or approve themselves
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if new.role <> old.role and not (old.onboarded = false and new.role in ('SEEKER', 'EMPLOYER')) then
    raise exception 'Your role can only be changed by HireMe.';
  end if;
  if old.onboarded and not new.onboarded then new.onboarded := true; end if;
  -- Choosing a role while onboarding: job seekers are approved, employers wait for HireMe
  new.approved := case when new.role <> old.role then new.role = 'SEEKER' else old.approved end;
  return new;
end $$;

drop policy if exists "talents: read" on public.talents;
create policy "talents: read" on public.talents for select to authenticated
  using (user_id = auth.uid() or public.can_see_cvs());

drop policy if exists "jobs: employer writes" on public.jobs;
drop policy if exists "jobs: employer adds" on public.jobs;
create policy "jobs: employer adds" on public.jobs for insert to authenticated
  with check (employer_id = auth.uid() and public.my_role() = 'EMPLOYER' and public.can_see_cvs());
drop policy if exists "jobs: employer edits" on public.jobs;
create policy "jobs: employer edits" on public.jobs for update to authenticated
  using (employer_id = auth.uid()) with check (employer_id = auth.uid());
drop policy if exists "jobs: employer deletes" on public.jobs;
create policy "jobs: employer deletes" on public.jobs for delete to authenticated using (employer_id = auth.uid());

drop policy if exists "conversations: employer starts" on public.conversations;
create policy "conversations: employer starts" on public.conversations for insert to authenticated
  with check (employer_id = auth.uid() and public.my_role() = 'EMPLOYER' and public.can_see_cvs());

-- ─── 1. Files ────────────────────────────────────────────────────────────────

drop policy if exists "files: signed-in read" on storage.objects;
drop policy if exists "files: who may open" on storage.objects;
create policy "files: who may open" on storage.objects for select to authenticated using (
  bucket_id = 'files' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.profiles p
      where p.id::text = (storage.foldername(name))[1]
        and (p.role <> 'SEEKER' or public.can_see_cvs())
    )
  )
);

-- ─── 3. Rows change only the way the app changes them ────────────────────────

-- The ids inside `data` follow the row's columns (set on every write)
create or replace function public.data_matches_columns() returns trigger
language plpgsql set search_path = public as $$
declare
  cols jsonb := to_jsonb(new);
begin
  new.data := new.data || jsonb_strip_nulls(jsonb_build_object(
    'id', case when tg_table_name in ('saved_jobs', 'saved_talents', 'follows') then null else cols->'id' end,
    'userId', cols->'user_id',
    'employerId', cols->'employer_id',
    'seekerId', cols->'seeker_id',
    'jobId', cols->'job_id',
    'conversationId', cols->'conversation_id',
    'senderId', cols->'sender_id'
  ));
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['talents', 'jobs', 'applications', 'conversations', 'messages', 'notifications', 'saved_jobs', 'saved_talents', 'follows'] loop
    execute format('drop trigger if exists data_matches_columns on public.%I', t);
    execute format('create trigger data_matches_columns before insert or update on public.%I for each row execute function public.data_matches_columns()', t);
  end loop;
end $$;

-- Only these keys of `data` may change on an update, and only by these people
create or replace function public.guard_updates() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  allowed text[];
begin
  if coalesce(auth.role(), '') = 'service_role' then return new; end if;
  -- Which row it is never changes
  if to_jsonb(new) - 'data' - 'created_at' <> to_jsonb(old) - 'data' - 'created_at' then
    raise exception 'That can''t be changed.';
  end if;

  if tg_table_name = 'applications' then
    if exists (select 1 from public.jobs j where j.id = old.job_id and j.employer_id = me) then
      allowed := array['status', 'updatedAt'];  -- the employer decides
      if new.data->>'status' not in ('Applied', 'Shortlisted', 'Not selected') then
        raise exception 'Not a valid status.';
      end if;
    else
      allowed := array['note', 'updatedAt'];    -- the job seeker may only reword their note
    end if;
  elsif tg_table_name = 'messages' then
    if old.sender_id = me then raise exception 'Messages can''t be edited.'; end if;
    allowed := array['readAt'];                 -- the recipient marks it read
  elsif tg_table_name = 'conversations' then
    allowed := array['updatedAt'];
  elsif tg_table_name = 'notifications' then
    allowed := array['readAt'];
  end if;

  if (new.data - allowed) <> (old.data - allowed) then
    raise exception 'That can''t be changed.';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['applications', 'messages', 'conversations', 'notifications'] loop
    execute format('drop trigger if exists guard_updates on public.%I', t);
    execute format('create trigger guard_updates before update on public.%I for each row execute function public.guard_updates()', t);
  end loop;
end $$;

-- New applications always start as "Applied"; notifications are only about open jobs, for job seekers
create or replace function public.guard_new_rows() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if tg_table_name = 'applications' then
    new.data := new.data || '{"status": "Applied"}'::jsonb;
  elsif tg_table_name = 'notifications' and new.user_id <> auth.uid() then
    if not exists (select 1 from public.profiles p where p.id = new.user_id and p.role = 'SEEKER') then
      raise exception 'Notifications are for job seekers.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists guard_new_rows on public.applications;
create trigger guard_new_rows before insert on public.applications for each row execute function public.guard_new_rows();
drop trigger if exists guard_new_rows on public.notifications;
create trigger guard_new_rows before insert on public.notifications for each row execute function public.guard_new_rows();

-- ─── 5. AI limits ────────────────────────────────────────────────────────────

create table if not exists public.ai_usage (
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, kind, day)
);
alter table public.ai_usage enable row level security;
-- No policies: only take_ai_credit below (and the admin) touches it

-- Uses one of today's AI requests; false once the day's limit is reached
create or replace function public.take_ai_credit(kind text, daily_limit int) returns boolean
language plpgsql security definer set search_path = public as $$
declare used int;
begin
  if auth.uid() is null then return false; end if;
  insert into public.ai_usage as u (user_id, kind, day, count) values (auth.uid(), kind, current_date, 1)
  on conflict (user_id, kind, day) do update set count = u.count + 1 where u.count < daily_limit
  returning count into used;
  return used is not null;
end $$;
revoke all on function public.take_ai_credit(text, int) from public, anon;
grant execute on function public.take_ai_credit(text, int) to authenticated;
