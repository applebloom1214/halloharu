begin;

create or replace function public.restore_hidden_content(
  target_kind text,
  target_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 관리자 권한 확인
  if not public.is_current_user_admin() then
    raise exception '관리자 권한이 필요합니다.'
      using errcode = '42501';
  end if;

  -- 전달받은 값 확인
  if target_kind is null
    or target_kind not in ('post', 'comment', 'humor')
    or target_id is null
    or target_id <= 0
  then
    raise exception '올바르지 않은 복원 대상입니다.'
      using errcode = '22023';
  end if;

  -- 대상 콘텐츠 복원
  case target_kind
    when 'post' then
      update public.posts
      set
        is_hidden = false,
        hidden_at = null,
        hidden_by = null
      where id = target_id
        and is_hidden = true;

    when 'comment' then
      update public.comments
      set
        is_hidden = false,
        hidden_at = null,
        hidden_by = null
      where id = target_id
        and is_hidden = true;

    when 'humor' then
      update public.humor_captions
      set
        is_hidden = false,
        hidden_at = null,
        hidden_by = null
      where id = target_id
        and is_hidden = true;
  end case;

  return found;
end;
$$;

revoke all
on function public.restore_hidden_content(text, bigint)
from public, anon, authenticated;

grant execute
on function public.restore_hidden_content(text, bigint)
to authenticated;

commit;