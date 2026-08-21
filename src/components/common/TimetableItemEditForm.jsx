import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { geocodePlaceNames } from '../../lib/excel'
import './TimetableItemEditForm.css'

/**
 * Inline edit form for one timetable_items row — shared by the teacher's 모둠상세 page and the group leader's 일정 tab.
 * Pass `item={null}` (with `groupId`) to use it in "add new item" mode instead of editing an existing row.
 */
export default function TimetableItemEditForm({ item, groupId, hasCheckin, mapsLoaded, onSaved, onCancel }) {
  const isAdding = !item
  const [time, setTime] = useState(item?.time_planned?.slice(0, 5) ?? '')
  const [place, setPlace] = useState(item?.place_name ?? '')
  const [task, setTask] = useState(item?.task ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!time || !place) {
      setError('시간과 장소를 입력해주세요.')
      return
    }

    setSaving(true)
    setError('')

    let lat = null
    let lng = null
    let geocodeStatus = 'pending'

    if (isAdding || place !== item.place_name) {
      if (!mapsLoaded) {
        setError('지도를 아직 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
        setSaving(false)
        return
      }
      const geocoded = await geocodePlaceNames([place])
      lat = geocoded[place].lat
      lng = geocoded[place].lng
      geocodeStatus = geocoded[place].status
    }

    if (isAdding) {
      const { error: insertError } = await supabase.rpc('insert_timetable_item', {
        p_group_id: groupId,
        p_time_planned: time,
        p_place_name: place,
        p_task: task || null,
        p_lat: lat,
        p_lng: lng,
        p_geocode_status: geocodeStatus,
      })
      setSaving(false)
      if (insertError) {
        setError(insertError.message)
        return
      }
      onSaved()
      return
    }

    const updateGeocode = place !== item.place_name
    const { error: updateError } = await supabase.rpc('update_timetable_item', {
      p_item_id: item.id,
      p_time_planned: time,
      p_place_name: place,
      p_task: task || null,
      p_lat: updateGeocode ? lat : null,
      p_lng: updateGeocode ? lng : null,
      p_geocode_status: updateGeocode ? geocodeStatus : null,
      p_update_geocode: updateGeocode,
    })
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    onSaved()
  }

  return (
    <div className="timetable-edit-form">
      {hasCheckin && (
        <p className="timetable-edit-form__warning">이미 체크인된 항목입니다 — 장소를 바꾸면 지도 위치도 새로 계산됩니다.</p>
      )}
      <div className="timetable-edit-form__fields">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <input placeholder="장소" value={place} onChange={(e) => setPlace(e.target.value)} />
        <input placeholder="할일 (선택)" value={task} onChange={(e) => setTask(e.target.value)} />
      </div>
      {error && <p className="timetable-edit-form__error">{error}</p>}
      <div className="timetable-edit-form__actions">
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? (isAdding ? '추가 중...' : '저장 중...') : isAdding ? '추가' : '저장'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          취소
        </button>
      </div>
    </div>
  )
}

/** Shared confirm+delete for one timetable_items row. Returns true if deleted. */
export async function deleteTimetableItem(item, hasCheckin) {
  const message = hasCheckin
    ? `"${item.place_name}" 항목을 삭제하시겠습니까? 이미 기록된 체크인(사진/위치)도 함께 삭제됩니다.`
    : `"${item.place_name}" 항목을 삭제하시겠습니까?`
  if (!window.confirm(message)) return false

  const { error } = await supabase.from('timetable_items').delete().eq('id', item.id)
  if (error) {
    window.alert(`삭제 실패: ${error.message}`)
    return false
  }
  return true
}
