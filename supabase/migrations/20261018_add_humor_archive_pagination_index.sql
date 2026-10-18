create index if not exists humor_prompts_ends_at_id_index
on public.humor_prompts (ends_at desc, id desc);