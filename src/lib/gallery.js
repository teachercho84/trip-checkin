import { supabase } from './supabaseClient'
import { compressPhoto } from './photo'

/** gallery-photos 버킷은 공개 읽기 정책이라 서명 없이 바로 공개 URL을 쓸 수 있다. */
export function getGalleryPhotoUrl(photoPath) {
  if (!photoPath) return null
  return supabase.storage.from('gallery-photos').getPublicUrl(photoPath).data.publicUrl
}

/**
 * 전체 모둠 통합 목록 (최신순). 추천 TOP 3만 별도로 뽑아 보여주는 정렬은
 * GalleryGrid에서 이 목록을 그대로 받아 화면에서 계산한다.
 */
export async function fetchGalleryPhotos() {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('id, group_id, group_name, uploader_name, photo_path, title, like_count, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** 사진 압축 후 업로드 + 기록 (일반 학생/모둠장 공용, add_gallery_photo RPC). */
export async function uploadGalleryPhoto({ accessCode, groupId, name, password, title, photoFile }) {
  const compressedBlob = await compressPhoto(photoFile)
  const photoPath = `${groupId}/${crypto.randomUUID()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('gallery-photos')
    .upload(photoPath, compressedBlob, { contentType: 'image/jpeg' })
  if (uploadError) throw uploadError

  const { data, error: rpcError } = await supabase.rpc('add_gallery_photo', {
    p_access_code: accessCode,
    p_photo_path: photoPath,
    p_password: password,
    p_name: name,
    p_title: title,
  })
  if (rpcError) throw rpcError

  return data
}

/** 추천 — 권한 체크 없이 누구나 호출 가능 (중복 방지는 호출하는 쪽에서 localStorage로 처리). */
export async function likeGalleryPhoto(photoId) {
  const { error } = await supabase.rpc('like_gallery_photo', { p_photo_id: photoId })
  if (error) throw error
}

/** 일반 학생용 삭제 — 비밀번호가 맞아야 지워짐 (delete_gallery_photo RPC). */
export async function deleteGalleryPhotoWithPassword({ accessCode, photoId, photoPath, password }) {
  const { error: rpcError } = await supabase.rpc('delete_gallery_photo', {
    p_access_code: accessCode,
    p_photo_id: photoId,
    p_password: password,
  })
  if (rpcError) throw rpcError

  await supabase.storage.from('gallery-photos').remove([photoPath])
}

/**
 * 모둠장/교사용 삭제 — RLS로 직접 허용된 경우에만 성공.
 * 모둠장이 다른 모둠 사진을 시도하면 RLS가 0건 삭제로 조용히 막으므로, .select()로
 * 실제로 지워졌는지 확인해서 권한 없음을 구분해준다.
 */
export async function deleteGalleryPhotoDirect({ photoId, photoPath }) {
  const { data, error } = await supabase.from('gallery_photos').delete().eq('id', photoId).select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('삭제 권한이 없습니다.')

  await supabase.storage.from('gallery-photos').remove([photoPath])
}
