-- Some AI features have a limit for the whole account instead of per day (CV import: 3 times in total)
create or replace function public.take_ai_credit_total(kind text, total_limit int) returns boolean
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare used int;
begin
  if auth.uid() is null then return false; end if;
  -- One at a time per user, so two requests at once can't both take the last one
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text || take_ai_credit_total.kind));
  select coalesce(sum(count), 0) into used from public.ai_usage where user_id = auth.uid() and kind = take_ai_credit_total.kind;
  if used >= take_ai_credit_total.total_limit then return false; end if;
  insert into public.ai_usage as u (user_id, kind, day, count) values (auth.uid(), take_ai_credit_total.kind, current_date, 1)
  on conflict (user_id, kind, day) do update set count = u.count + 1;
  return true;
end $$;
revoke all on function public.take_ai_credit_total(text, int) from public, anon;
grant execute on function public.take_ai_credit_total(text, int) to authenticated;
