-- Fitness Incentive QR Workout Tracker — database setup
-- Paste this whole file into Supabase: SQL Editor → New query → Run.
-- It is safe to run once on a fresh project.

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------

-- One row per person who can log in (members and staff).
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  phone text,
  full_name text,
  role text not null default 'member' check (role in ('member', 'staff')),
  created_at timestamptz not null default now()
);

-- Each gym machine. Its id is what the QR code links to.
create table public.machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

-- One workout on one machine by one member.
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  machine_id uuid not null references public.machines on delete cascade,
  performed_at timestamptz not null default now()
);
create index workout_sessions_user_machine_idx
  on public.workout_sessions (user_id, machine_id, performed_at desc);
create index workout_sessions_machine_idx
  on public.workout_sessions (machine_id, performed_at desc);

-- The sets inside a workout (weight in lbs).
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions on delete cascade,
  set_number int not null check (set_number > 0),
  weight numeric not null check (weight >= 0),
  reps int not null check (reps > 0)
);
create index workout_sets_session_idx on public.workout_sets (session_id);

-- Gym-wide settings (a single row).
create table public.settings (
  id int primary key default 1 check (id = 1),
  inactive_days int not null default 14 check (inactive_days > 0)
);
insert into public.settings default values;

-- ---------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------

-- Create a profile automatically whenever someone signs up.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- True when the logged-in user is staff.
create function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'staff');
$$;

-- Save a workout and its sets in one step.
-- p_sets looks like: [{"weight": 100, "reps": 10}, {"weight": 110, "reps": 8}]
create function public.log_workout(p_machine_id uuid, p_sets jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_session_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You need to log in first';
  end if;
  if jsonb_array_length(p_sets) = 0 then
    raise exception 'Add at least one set';
  end if;

  insert into public.workout_sessions (user_id, machine_id)
  values (auth.uid(), p_machine_id)
  returning id into v_session_id;

  insert into public.workout_sets (session_id, set_number, weight, reps)
  select v_session_id, t.ord::int, (t.s ->> 'weight')::numeric, (t.s ->> 'reps')::int
  from jsonb_array_elements(p_sets) with ordinality as t(s, ord);

  return v_session_id;
end;
$$;

-- ---------------------------------------------------------------
-- Security (Row Level Security): members see only their own data,
-- staff see everything.
-- ---------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.machines enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.settings enable row level security;

create policy "read own profile or staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());
-- Members may only change their name (never their role).
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

create policy "anyone can view machines" on public.machines
  for select using (true);
create policy "staff manage machines" on public.machines
  for all using (public.is_staff()) with check (public.is_staff());

create policy "read own sessions or staff" on public.workout_sessions
  for select using (user_id = auth.uid() or public.is_staff());
create policy "log own sessions" on public.workout_sessions
  for insert with check (user_id = auth.uid());
create policy "delete own sessions" on public.workout_sessions
  for delete using (user_id = auth.uid());

create policy "read own sets or staff" on public.workout_sets
  for select using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and (s.user_id = auth.uid() or public.is_staff())
    )
  );
create policy "log own sets" on public.workout_sets
  for insert with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "logged-in users read settings" on public.settings
  for select to authenticated using (true);
create policy "staff update settings" on public.settings
  for update using (public.is_staff());

-- ---------------------------------------------------------------
-- Views for the staff dashboard (they respect the rules above)
-- ---------------------------------------------------------------

-- Each member with their last workout date and total workouts.
create view public.member_activity with (security_invoker = true) as
select
  p.id,
  p.full_name,
  p.phone,
  p.created_at,
  max(s.performed_at) as last_workout_at,
  count(s.id)::int as session_count
from public.profiles p
left join public.workout_sessions s on s.user_id = p.id
where p.role = 'member'
group by p.id;

-- How much each machine is used.
create view public.machine_usage with (security_invoker = true) as
select
  m.id,
  m.name,
  count(s.id)::int as session_count,
  count(s.id) filter (where s.performed_at > now() - interval '30 days')::int as sessions_last_30_days,
  count(distinct s.user_id)::int as member_count
from public.machines m
left join public.workout_sessions s on s.machine_id = m.id
group by m.id;

-- Each member's heaviest set on each machine (ties go to more reps, then the earliest date).
create view public.personal_records with (security_invoker = true) as
select distinct on (s.user_id, s.machine_id)
  s.user_id,
  s.machine_id,
  m.name as machine_name,
  ws.weight,
  ws.reps,
  s.performed_at
from public.workout_sets ws
join public.workout_sessions s on s.id = ws.session_id
join public.machines m on m.id = s.machine_id
order by s.user_id, s.machine_id, ws.weight desc, ws.reps desc, s.performed_at asc;

-- ---------------------------------------------------------------
-- Machine photos (public storage bucket; only staff can upload)
-- ---------------------------------------------------------------

insert into storage.buckets (id, name, public) values ('machine-photos', 'machine-photos', true);

create policy "staff upload machine photos" on storage.objects
  for insert with check (bucket_id = 'machine-photos' and public.is_staff());
create policy "staff update machine photos" on storage.objects
  for update using (bucket_id = 'machine-photos' and public.is_staff());
create policy "staff delete machine photos" on storage.objects
  for delete using (bucket_id = 'machine-photos' and public.is_staff());
