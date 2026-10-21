-- The private part of a job seeker's CV: their references' names and contact details.
-- Employers read CVs (talents) for the Pool, so these are kept out of talents.data and only their owner
-- can read or change them here.

create table if not exists public.cv_private (
  id uuid primary key references public.profiles on delete cascade default auth.uid(),
  data jsonb not null default '{}'::jsonb
);

alter table public.cv_private enable row level security;

drop policy if exists "cv private: owner reads" on public.cv_private;
create policy "cv private: owner reads" on public.cv_private
  for select to authenticated using (id = auth.uid());
drop policy if exists "cv private: owner adds" on public.cv_private;
create policy "cv private: owner adds" on public.cv_private
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "cv private: owner edits" on public.cv_private;
create policy "cv private: owner edits" on public.cv_private
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
