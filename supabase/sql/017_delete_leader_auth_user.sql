-- "모둠 삭제"를 함수 하나로 통합: 모둠(+cascade로 모둠원/일정/체크인/갤러리 기록/auth_accounts)
-- 삭제와 모둠장의 실제 로그인 계정(Supabase Auth 사용자) 삭제를 한 번에 처리한다.
-- SECURITY DEFINER 함수라 auth 스키마에 접근 가능 — is_teacher() 확인 후에만 동작.
-- (사진 파일 자체는 Storage라는 별개 시스템이라 이 함수로는 못 지우고, 클라이언트에서
-- 별도로 storage.remove()를 호출해야 한다 — 데이터베이스 함수만으로는 도달할 수 없는 부분.)
create or replace function delete_group_with_leader_account(p_group_id uuid) returns void
language plpgsql security definer
as $$
declare v_internal_code text;
begin
  if not is_teacher() then
    raise exception 'teacher 권한이 필요합니다.';
  end if;

  select aa.internal_code into v_internal_code
  from groups g join auth_accounts aa on aa.id = g.auth_account_id
  where g.id = p_group_id;

  delete from groups where id = p_group_id;

  if v_internal_code is not null then
    delete from auth.users where email = v_internal_code || '@internal.local';
  end if;
end;
$$;
grant execute on function delete_group_with_leader_account(uuid) to authenticated;
