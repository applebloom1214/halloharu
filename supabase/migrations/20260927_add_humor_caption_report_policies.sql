grant select, insert
on table public.humor_caption_reports
to authenticated;

create policy "Users can read own humor caption reports"
on public.humor_caption_reports
for select
to authenticated
using (reporter_id = (select auth.uid()));

create policy "Users can report other humor captions"
on public.humor_caption_reports
for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and exists (
    select 1
    from public.humor_caption_feed as captions
    where captions.id = humor_caption_reports.caption_id
      and captions.is_own = false
  )
);