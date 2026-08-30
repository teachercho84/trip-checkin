import { supabase } from './supabaseClient'

/**
 * 모둠 삭제 전체 흐름: 체크인/갤러리 사진 경로를 먼저 모아둔 뒤, DB 삭제(+모둠장 계정 삭제,
 * delete_group_with_leader_account RPC)를 하고, 마지막으로 Storage의 실제 사진 파일까지 지운다.
 * GroupDetailPage(모둠상세)와 설정 탭의 모둠 삭제 폼이 공용으로 쓴다.
 */
export async function deleteGroupCompletely(groupId) {
  const [{ data: checkinRows }, { data: galleryRows }] = await Promise.all([
    supabase.from('checkins').select('photo_path').eq('group_id', groupId),
    supabase.from('gallery_photos').select('photo_path').eq('group_id', groupId),
  ])
  const checkinPhotoPaths = (checkinRows ?? []).map((r) => r.photo_path).filter(Boolean)
  const galleryPhotoPaths = (galleryRows ?? []).map((r) => r.photo_path)

  const { error } = await supabase.rpc('delete_group_with_leader_account', { p_group_id: groupId })
  if (error) throw error

  if (checkinPhotoPaths.length > 0) {
    await supabase.storage.from('checkin-photos').remove(checkinPhotoPaths)
  }
  if (galleryPhotoPaths.length > 0) {
    await supabase.storage.from('gallery-photos').remove(galleryPhotoPaths)
  }
}
