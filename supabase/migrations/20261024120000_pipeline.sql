-- Pipeline backend: sites, processing runs, per-fish results, species counts,
-- taxonomy, admin role. The VM worker writes results with the service-role key
-- (bypasses RLS); users can only read them.

-- ---------------------------------------------------------------- roles
alter table public.profiles
  add column role text not null default 'analyst' check (role in ('analyst', 'admin'));

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- users must not promote themselves
revoke update on public.profiles from authenticated, anon;
grant update (email, phone, gender, organization, accepted_terms, accepted_terms_at)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------- sites
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emirate text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  habitat text,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.sites enable row level security;
create policy sites_select on public.sites for select to authenticated using (true);
create policy sites_insert on public.sites for insert to authenticated with check (created_by = auth.uid());
create policy sites_admin_update on public.sites for update to authenticated using (public.is_admin());
create policy sites_admin_delete on public.sites for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- datasets (= videos)
alter table public.datasets add column site_id uuid references public.sites on delete set null;
create index on public.datasets (user_id, created_at desc);

-- processing_status is the worker's to set, not the user's
revoke update on public.datasets from authenticated, anon;
grant update (name, location, capture_date, depth, site_id) on public.datasets to authenticated;
drop policy datasets_insert_own on public.datasets;
create policy datasets_insert_own on public.datasets for insert to authenticated
  with check (auth.uid() = user_id and processing_status = 'pending');
create policy datasets_admin_select on public.datasets for select to authenticated using (public.is_admin());

create function public.can_see_dataset(p_dataset uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.datasets d
                 where d.id = p_dataset and (d.user_id = auth.uid() or public.is_admin()))
$$;

-- ---------------------------------------------------------------- taxonomy
create table public.taxa (
  species text primary key,           -- binomial, matches the classifier's class names
  genus text not null,
  family text not null,
  common_name text,
  iucn_status text check (iucn_status in ('LC','NT','VU','EN','CR','DD','NE')),
  origin text check (origin in ('native','introduced','endemic'))
);
alter table public.taxa enable row level security;
create policy taxa_select on public.taxa for select to authenticated using (true);

-- ---------------------------------------------------------------- runs
-- One processing of one video. Re-processing with a newer model = a new run;
-- old results stay.
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.datasets on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','done','failed')),
  progress real not null default 0,
  error text,
  worker text,
  model_version text,
  config jsonb,
  annotated_path text,
  frames int,
  fish_tracked int,
  richness int,
  shannon real,
  simpson real,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index on public.runs (status, created_at);
create index on public.runs (dataset_id, created_at desc);
alter table public.runs enable row level security;
create policy runs_select on public.runs for select to authenticated using (public.can_see_dataset(dataset_id));

create table public.fish (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.runs on delete cascade,
  track_id int not null,
  level text not null check (level in ('species','genus','family','unidentified')),
  name text not null,
  confidence real,
  n_frames int,
  first_frame int,
  last_frame int
);
create index on public.fish (run_id);
create index on public.fish (name);
alter table public.fish enable row level security;
create policy fish_select on public.fish for select to authenticated
  using (public.can_see_dataset((select r.dataset_id from public.runs r where r.id = run_id)));

create table public.species_counts (
  run_id uuid not null references public.runs on delete cascade,
  species text not null,
  maxn int not null,
  maxn_frame int,
  primary key (run_id, species)
);
alter table public.species_counts enable row level security;
create policy species_counts_select on public.species_counts for select to authenticated
  using (public.can_see_dataset((select r.dataset_id from public.runs r where r.id = run_id)));

-- every upload gets queued; existing uploads too
create function public.queue_run() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.runs (dataset_id) values (new.id);
  return new;
end $$;
create trigger trg_datasets_queue after insert on public.datasets
  for each row execute function public.queue_run();
insert into public.runs (dataset_id) select id from public.datasets;

-- datasets.processing_status mirrors its latest run
create function public.sync_dataset_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.datasets
     set processing_status = case new.status when 'done' then 'ready' else new.status end
   where id = new.dataset_id;
  return new;
end $$;
create trigger trg_runs_sync after insert or update of status on public.runs
  for each row execute function public.sync_dataset_status();

-- ---------------------------------------------------------------- worker RPCs (service role only)
create function public.claim_run(p_worker text) returns json
language plpgsql security definer set search_path = '' as $$
declare r public.runs;
begin
  -- ponytail: a run stuck in 'processing' for 3h is assumed dead and re-queued;
  -- add worker heartbeats if videos ever take longer than that.
  update public.runs set status = 'pending'
   where status = 'processing' and started_at < now() - interval '3 hours';

  update public.runs set status = 'processing', started_at = now(), worker = p_worker,
                         progress = 0, error = null
   where id = (select id from public.runs where status = 'pending'
               order by created_at limit 1 for update skip locked)
  returning * into r;
  if r.id is null then return null; end if;
  return (select json_build_object('run_id', r.id, 'dataset_id', r.dataset_id,
                                   'user_id', d.user_id, 'storage_path', d.storage_path)
            from public.datasets d where d.id = r.dataset_id);
end $$;

create function public.finish_run(p_run uuid, p_result jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.fish (run_id, track_id, level, name, confidence, n_frames, first_frame, last_frame)
  select p_run, x.track_id, x.level, x.name, x.confidence, x.n_frames, x.first_frame, x.last_frame
    from jsonb_to_recordset(p_result -> 'fish') as x(track_id int, level text, name text, confidence real,
                                                       n_frames int, first_frame int, last_frame int);
  insert into public.species_counts (run_id, species, maxn, maxn_frame)
  select p_run, x.species, x.maxn, x.maxn_frame
    from jsonb_to_recordset(p_result -> 'counts') as x(species text, maxn int, maxn_frame int);
  update public.runs set
    status = 'done', progress = 1, finished_at = now(),
    model_version = p_result ->> 'model_version', config = p_result -> 'config',
    annotated_path = p_result ->> 'annotated_path',
    frames = (p_result ->> 'frames')::int, fish_tracked = (p_result ->> 'fish_tracked')::int,
    richness = (p_result ->> 'richness')::int,
    shannon = (p_result ->> 'shannon')::real, simpson = (p_result ->> 'simpson')::real
  where id = p_run;
end $$;

revoke execute on function public.claim_run(text), public.finish_run(uuid, jsonb),
  public.queue_run(), public.sync_dataset_status() from public, anon, authenticated;
grant execute on function public.claim_run(text), public.finish_run(uuid, jsonb) to service_role;

-- ---------------------------------------------------------------- feedback: admins handle tickets
create policy feedback_admin_select on public.feedback for select to authenticated using (public.is_admin());
create policy feedback_admin_update on public.feedback for update to authenticated using (public.is_admin());

-- live status updates in the dashboard
alter publication supabase_realtime add table public.runs;
