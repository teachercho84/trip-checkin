import { supabase } from './supabaseClient'
import { compressPhoto } from './photo'
import { getCurrentPositionOnce } from './geolocation'

/**
 * checkin-photos 버킷은 공개 읽기 정책이라 서명 없이 바로 공개 URL을 쓸 수 있다.
 * 재체크인은 같은 경로에 사진을 덮어쓰므로, checkedInAt을 캐시 무효화 쿼리로 붙여
 * 브라우저가 예전 캐시된 사진을 계속 보여주지 않게 한다.
 */
export function getCheckinPhotoUrl(photoPath, checkedInAt) {
  if (!photoPath) return null
  const url = supabase.storage.from('checkin-photos').getPublicUrl(photoPath).data.publicUrl
  return checkedInAt ? `${url}?t=${encodeURIComponent(checkedInAt)}` : url
}

/**
 * Full check-in flow for a single itinerary item: compress the photo,
 * capture location once, upload the photo to Storage, then record the
 * check-in via the `submit_checkin` RPC (access-code scoped, server-side
 * validated so a group can only check in to its own itinerary items).
 */
export async function performCheckin({ accessCode, groupId, timetableItemId, photoFile }) {
  const [{ lat, lng }, compressedBlob] = await Promise.all([
    getCurrentPositionOnce(),
    compressPhoto(photoFile),
  ])

  const photoPath = `${groupId}/${timetableItemId}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('checkin-photos')
    .upload(photoPath, compressedBlob, { contentType: 'image/jpeg', upsert: true })
  if (uploadError) throw uploadError

  const { data, error: rpcError } = await supabase.rpc('submit_checkin', {
    p_access_code: accessCode,
    p_timetable_item_id: timetableItemId,
    p_lat: lat,
    p_lng: lng,
    p_photo_path: photoPath,
  })
  if (rpcError) throw rpcError

  return data
}
