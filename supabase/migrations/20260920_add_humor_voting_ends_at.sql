alter table public.humor_prompts
add column voting_ends_at timestamptz;

update public.humor_prompts
set voting_ends_at = ends_at + interval '2 days'
where voting_ends_at is null;

alter table public.humor_prompts
alter column voting_ends_at set not null;

alter table public.humor_prompts
add constraint humor_prompts_voting_ends_at_after_ends_at
check (voting_ends_at > ends_at);