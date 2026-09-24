alter table public.humor_prompts
drop constraint if exists humor_prompts_voting_ends_at_after_ends_at;

alter table public.humor_prompts
drop column if exists voting_ends_at;