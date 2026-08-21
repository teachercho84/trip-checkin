-- 재체크인 시 같은 경로(${groupId}/${timetableItemId}.jpg)에 사진을 다시 업로드하면
-- Storage upsert가 내부적으로 UPDATE를 수행하는데, checkin-photos 버킷에는 INSERT 정책만
-- 있고 UPDATE 정책이 없어 "new row violates row-level security policy"로 막혔다
-- (002_rls.sql:63-66, "수정/삭제는 막는다"는 재체크인 기능이 생기기 전의 설계).
-- INSERT 정책과 동일한 수준(버킷만 확인)으로 UPDATE도 허용한다.
-- 001~010 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

create policy anon_update_checkin_photos on storage.objects for update
  using (bucket_id = 'checkin-photos')
  with check (bucket_id = 'checkin-photos');
