-- Guest mode (Supabase anonymous sign-in): a guest has no email, and handle_new_user()
-- copies new.email into profiles, so the NOT NULL made every guest sign-in fail.
alter table public.profiles alter column email drop not null;
