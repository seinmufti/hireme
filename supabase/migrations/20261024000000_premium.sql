-- HireMe Premium, given by HireMe's admins (people contact HireMe for it; there's no online payment yet).
-- Premium lasts until premium_until; only admins (the service role, via /api/admin/users) can set it.
alter table public.profiles add column if not exists premium_until timestamptz;

-- Users can't change their role (except choosing once while onboarding), approve themselves or give
-- themselves Premium
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
  new.premium_until := old.premium_until;
  return new;
end $$;
