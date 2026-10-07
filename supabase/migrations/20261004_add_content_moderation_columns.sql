begin;

alter table public.posts
  add column if not exists is_hidden boolean not null default false,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid
    references auth.users(id)
    on delete set null;

alter table public.comments
  add column if not exists is_hidden boolean not null default false,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid
    references auth.users(id)
    on delete set null;

alter table public.humor_captions
  add column if not exists is_hidden boolean not null default false,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid
    references auth.users(id)
    on delete set null;

commit;