-- Notifications go both ways: employers tell job seekers about their applications (viewed, a new status, not
-- selected), and job seekers tell a job's employer when they apply or withdraw. Each one is also emailed
-- (by /api/notify, with the service role, which marks it emailedAt).
drop policy if exists "notifications: create" on public.notifications;
create policy "notifications: create" on public.notifications for insert to authenticated with check (
  user_id = auth.uid()
  -- an employer, to anyone about their own job
  or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
  -- a job seeker, to the job's employer
  or (public.my_role() = 'SEEKER' and exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = user_id))
);

-- New applications always start as "Applied" and not yet viewed. Notifications for someone else: from an
-- employer only to job seekers; from a job seeker only to the job's employer, about applying, withdrawing or
-- asking to come back.
-- Nobody but the service role marks one emailed.
create or replace function public.guard_new_rows() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if tg_table_name = 'applications' then
    new.data := (new.data - 'viewedAt' - 'statusDates' - 'rejectionReason' - 'withdrawnAt' - 'reinstateRequest') || '{"status": "Applied"}'::jsonb;
  elsif tg_table_name = 'notifications' then
    new.data := new.data - 'emailedAt';
    if new.user_id <> auth.uid() then
      if public.my_role() = 'SEEKER' then
        if not exists (select 1 from public.jobs j where j.id = new.job_id and j.employer_id = new.user_id)
           or coalesce(new.data->>'kind', '') not in ('applied', 'withdrawn', 'reinstateRequest') then
          raise exception 'That notification can''t be sent.';
        end if;
      elsif not exists (select 1 from public.profiles p where p.id = new.user_id and p.role = 'SEEKER') then
        raise exception 'Notifications are for job seekers.';
      end if;
    end if;
  end if;
  return new;
end $$;
