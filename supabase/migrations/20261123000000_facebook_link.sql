-- A Facebook link on the profile (beside LinkedIn), private like the other contact details: its owner, and
-- companies' for everyone (see the "private: owner, or a company's public contact" rule)
alter table public.profile_private add column if not exists facebook text not null default '';
