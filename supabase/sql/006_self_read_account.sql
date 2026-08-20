-- 로그인한 사용자(교사/모둠장 누구든)가 자기 자신의 auth_accounts 행은 읽을 수 있게 허용.
-- 기존 teacher_all_accounts 정책(002_rls.sql)은 is_teacher()만 통과시키므로, 모둠장 로그인 시
-- SessionContext.resolveAuthRole()의 역할 조회가 RLS에 막혀 항상 빈 결과를 받고 있었다
-- — role이 절대 'leader'로 설정되지 못해 로그인 직후 ProtectedRoute가 다시 로그인 화면으로 돌려보냄.
-- 001~005 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

create policy self_read_own_account on auth_accounts for select using (
  internal_code = split_part(auth.jwt()->>'email', '@', 1)
);
