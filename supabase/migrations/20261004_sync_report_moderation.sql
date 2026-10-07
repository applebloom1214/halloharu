begin;

create or replace function public.hide_resolved_report_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  -- 조치 완료가 아니면 숨김 상태를 변경하지 않음
  if new.status <> 'resolved' then
    return new;
  end if;

  -- 관리자 권한 확인
  if current_user_id is null or not exists (
    select 1
    from public.admins
    where admins.user_id = current_user_id
  ) then
    raise exception '관리자 권한이 필요합니다.'
      using errcode = '42501';
  end if;

  -- 이미 조치 완료였던 신고는 재처리하지 않음
  if tg_op = 'UPDATE' then
    if old.status = new.status then
      return new;
    end if;
  end if;

  -- 신고 종류에 따라 대상 콘텐츠 숨김
  case tg_table_name
    when 'reports' then
      update public.posts
      set
        is_hidden = true,
        hidden_at = now(),
        hidden_by = current_user_id
      where id = new.post_id
        and is_hidden = false;

    when 'comment_reports' then
      update public.comments
      set
        is_hidden = true,
        hidden_at = now(),
        hidden_by = current_user_id
      where id = new.comment_id
        and is_hidden = false;

    when 'humor_caption_reports' then
      update public.humor_captions
      set
        is_hidden = true,
        hidden_at = now(),
        hidden_by = current_user_id
      where id = new.caption_id
        and is_hidden = false;

    else
      raise exception '지원하지 않는 신고 테이블입니다.';
  end case;

  return new;
end;
$$;

-- 직접 호출하는 함수가 아니라 트리거에서 실행하는 함수
revoke all
on function public.hide_resolved_report_content()
from public, anon, authenticated;

create or replace trigger hide_resolved_post_report
after insert or update of status
on public.reports
for each row
execute function public.hide_resolved_report_content();

create or replace trigger hide_resolved_comment_report
after insert or update of status
on public.comment_reports
for each row
execute function public.hide_resolved_report_content();

create or replace trigger hide_resolved_humor_report
after insert or update of status
on public.humor_caption_reports
for each row
execute function public.hide_resolved_report_content();

commit;