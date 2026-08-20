import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { geocodePlaceNames } from '../../lib/excel'
import './TimetableItemEditForm.css'

/** Inline edit form for one timetable_items row — shared by the teacher's 모둠상세 page and the group leader's 일정 tab. */
export default function TimetableItemEditForm({ item, hasCheckin, mapsLoaded, onSaved, onCancel }) {
  const [time, setTime] = useState(item.time_planned?.slice(0, 5) ?? '')
  const [place, setPlace] = useState(item.place_name)
  const [task, setTask] = useState(item.task ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')

    const update = { time_planned: time, place_name: place, task: task || null }

    if (place !== item.place_name) {
      if (!mapsLoaded) {
        setError('지도를 아직 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
        setSaving(false)
        return
      }
      const geocoded = await geocodePlaceNames([place])
      update.lat = geocoded[place].lat
      update.lng = geocoded[place].lng
      update.geocode_status = geocoded[place].status
    }

    const { error: updateError } = await supabase.from('timetable_items').update(update).eq('id', item.id)
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
          {saving ? '저장 중...' : '저장'}
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
