-- Where an application stands, as the job seeker sees it on their board: pending, viewed (the employer
-- opened their CV), shortlisted, contacted, interview, accepted or rejected. The employer sets the status
-- (and when it reached each one, statusDates, and why they weren't selected, rejectionReason) and the moment they first open the CV (viewedAt); nobody else can.
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
      allowed := array['status', 'updatedAt', 'viewedAt', 'statusDates', 'rejectionReason', 'withdrawnAt', 'reinstateRequest'];  -- the employer decides
      if new.data->>'status' not in ('Applied', 'Shortlisted', 'Contacted', 'Interview', 'Accepted', 'Not selected') then
        raise exception 'Not a valid status.';
      end if;
      -- Taking a withdrawn application back only answers the job seeker's request to come back
      if (new.data->'withdrawnAt') is distinct from (old.data->'withdrawnAt')
         and (new.data->'withdrawnAt' is not null or coalesce(old.data#>>'{reinstateRequest,status}', '') <> 'pending') then
        raise exception 'That can''t be changed.';
      end if;
      if (new.data->'reinstateRequest') is distinct from (old.data->'reinstateRequest')
         and (coalesce(old.data#>>'{reinstateRequest,status}', '') <> 'pending'
              or coalesce(new.data#>>'{reinstateRequest,status}', '') not in ('accepted', 'declined')
              or (new.data#>'{reinstateRequest,message}') is distinct from (old.data#>'{reinstateRequest,message}')) then
        raise exception 'That can''t be changed.';
      end if;
    else
      allowed := array['note', 'updatedAt', 'withdrawnAt', 'reinstateRequest'];    -- the job seeker may reword their note, withdraw, or ask to come back
      -- Withdrawing only once; asking to come back only after withdrawing, once, as a request
      if (new.data->'withdrawnAt') is distinct from (old.data->'withdrawnAt') and (old.data->'withdrawnAt' is not null or new.data->'withdrawnAt' is null) then
        raise exception 'That can''t be changed.';
      end if;
      if (new.data->'reinstateRequest') is distinct from (old.data->'reinstateRequest')
         and (old.data->'reinstateRequest' is not null or old.data->'withdrawnAt' is null or coalesce(new.data#>>'{reinstateRequest,status}', '') <> 'pending') then
        raise exception 'That can''t be changed.';
      end if;
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

-- New applications always start as "Applied" and not yet viewed; notifications are only about open jobs,
-- for job seekers
create or replace function public.guard_new_rows() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if tg_table_name = 'applications' then
    new.data := (new.data - 'viewedAt' - 'statusDates' - 'rejectionReason' - 'withdrawnAt' - 'reinstateRequest') || '{"status": "Applied"}'::jsonb;
  elsif tg_table_name = 'notifications' and new.user_id <> auth.uid() then
    if not exists (select 1 from public.profiles p where p.id = new.user_id and p.role = 'SEEKER') then
      raise exception 'Notifications are for job seekers.';
    end if;
  end if;
  return new;
end $$;
