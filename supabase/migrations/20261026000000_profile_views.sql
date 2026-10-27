-- Who opened a job seeker's CV (their "Viewers"): one row per viewer and job seeker, with the latest visit.
-- Employers write their own visits (recruiters aren't counted); only the job seeker and the viewer read them.
create table if not exists public.profile_views (
  id text primary key,
  seeker_id uuid not null references public.profiles on delete cascade,
  viewer_id uuid not null references public.profiles on delete cascade,
  data jsonb not null
);
alter table public.profile_views enable row level security;

drop policy if exists "profile views: the job seeker and the viewer read" on public.profile_views;
create policy "profile views: the job seeker and the viewer read" on public.profile_views for select to authenticated
  using (seeker_id = auth.uid() or viewer_id = auth.uid());

drop policy if exists "profile views: viewers add theirs" on public.profile_views;
create policy "profile views: viewers add theirs" on public.profile_views for insert to authenticated
  with check (viewer_id = auth.uid() and viewer_id <> seeker_id and public.my_role() <> 'RECRUITER');

drop policy if exists "profile views: viewers update theirs" on public.profile_views;
create policy "profile views: viewers update theirs" on public.profile_views for update to authenticated
  using (viewer_id = auth.uid()) with check (viewer_id = auth.uid() and public.my_role() <> 'RECRUITER');

-- The row says who and whom in its columns; the data always matches them, and the visit is stamped now
create or replace function public.profile_view_matches() returns trigger
language plpgsql set search_path = public as $$
begin
  new.data := new.data || jsonb_build_object('id', new.id, 'seekerId', new.seeker_id, 'viewerId', new.viewer_id, 'at', now());
  return new;
end $$;

drop trigger if exists profile_view_matches on public.profile_views;
create trigger profile_view_matches before insert or update on public.profile_views
  for each row execute function public.profile_view_matches();
