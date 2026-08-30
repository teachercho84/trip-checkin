-- 갤러리에 제목 + 추천수 기능 추가.

alter table gallery_photos add column title text;
alter table gallery_photos add column like_count integer not null default 0;

-- add_gallery_photo 시그니처가 바뀌므로(p_title 추가) 기존 4개 인자 버전을 지우고 새로 만든다.
drop function if exists add_gallery_photo(text, text, text, text);

create or replace function add_gallery_photo(
  p_access_code text, p_photo_path text, p_password text, p_name text, p_title text
) returns uuid
language plpgsql security definer
as $$
declare v_group_id uuid; v_group_name text; v_photo_id uuid;
begin
  select id, name into v_group_id, v_group_name from groups where access_code = p_access_code;
  if v_group_id is null then
    raise exception 'invalid access code';
  end if;

  insert into gallery_photos (group_id, group_name, uploader_name, photo_path, delete_password_hash, title)
  values (v_group_id, v_group_name, p_name, p_photo_path, crypt(p_password, gen_salt('bf')), p_title)
  returning id into v_photo_id;
  return v_photo_id;
end;
$$;
grant execute on function add_gallery_photo(text, text, text, text, text) to anon;

-- 추천 — 권한 체크 없이 누구나 실행 가능. 중복 방지는 서버가 아니라 클라이언트(localStorage)에서 처리.
create or replace function like_gallery_photo(p_photo_id uuid) returns void
language sql security definer
as $$
  update gallery_photos set like_count = like_count + 1 where id = p_photo_id;
$$;
grant execute on function like_gallery_photo(uuid) to anon;
