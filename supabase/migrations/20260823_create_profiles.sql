create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  nickname text
    not null
    check (char_length(nickname) between 2 and 12)
    check (nickname ~ '^[가-힣A-Za-z0-9]+$'),

  created_at timestamptz
    not null
    default now()
);

create unique index profiles_nickname_lower_unique
on public.profiles (lower(nickname));

alter table public.profiles enable row level security;

grant select
on table public.profiles
to anon, authenticated;

grant insert, update
on table public.profiles
to authenticated;

create policy "Anyone can read profiles"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);