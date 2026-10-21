-- take_ai_credit: its "kind" parameter clashed with the ai_usage column of the same name
create or replace function public.take_ai_credit(kind text, daily_limit int) returns boolean
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare used int;
begin
  if auth.uid() is null then return false; end if;
  insert into public.ai_usage as u (user_id, kind, day, count) values (auth.uid(), take_ai_credit.kind, current_date, 1)
  on conflict (user_id, kind, day) do update set count = u.count + 1 where u.count < take_ai_credit.daily_limit
  returning u.count into used;
  return used is not null;
end $$;
revoke all on function public.take_ai_credit(text, int) from public, anon;
grant execute on function public.take_ai_credit(text, int) to authenticated;
