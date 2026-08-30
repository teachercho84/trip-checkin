-- checkin-photos 버킷에는 원래 삭제 정책이 없었음(한번 올리면 안 지운다는 의도적 설계).
-- 이제 "모둠 삭제" 시 관련 사진 파일까지 함께 정리하려면 삭제 권한이 필요해서 추가한다.
create policy anon_delete_checkin_photos on storage.objects for delete
  using (bucket_id = 'checkin-photos');
