import { useMemo, useRef, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import { useGroupBundle } from '../../hooks/useGroupBundle'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'
import { performCheckin } from '../../lib/checkin'
import TimetableItemEditForm, { deleteTimetableItem } from '../../components/common/TimetableItemEditForm'
import './ScheduleTab.css'

function itemStatus(item, checkinsByItem) {
  return checkinsByItem[item.id] ? 'done' : 'pending'
}

export default function ScheduleTab() {
  const { accessCode, role } = useSession()
  const isLeader = role === 'leader'
  const mapsLoaded = useGoogleMapsLoaded()
  const { bundle, loading, error, refetch } = useGroupBundle(accessCode)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const fileInputRef = useRef(null)

  const checkinsByItem = useMemo(() => {
    const map = {}
    for (const c of bundle?.checkins ?? []) map[c.timetable_item_id] = c
    return map
  }, [bundle])

  const timetable = bundle?.timetable ?? []
  const currentItem = timetable.find((item) => itemStatus(item, checkinsByItem) === 'pending')

  function handleTakePhotoClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  async function handleCheckin() {
    if (!currentItem || !photoFile) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await performCheckin({
        accessCode,
        groupId: bundle.group.id,
        timetableItemId: currentItem.id,
        photoFile,
      })
      setPhotoFile(null)
      setPhotoPreviewUrl(null)
      await refetch()
    } catch (err) {
      setSubmitError(err.message ?? '체크인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteItem(item) {
    const deleted = await deleteTimetableItem(item, Boolean(checkinsByItem[item.id]))
    if (deleted) refetch()
  }

  if (!accessCode) return <p>접속 코드가 없습니다. 모둠 링크로 다시 접속해주세요.</p>
  if (loading) return <p>불러오는 중...</p>
  if (error) return <p className="schedule-tab__error">일정을 불러오지 못했습니다: {error.message}</p>

  return (
    <div className="schedule-tab">
      <h1>{bundle.group.name} 일정</h1>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {submitError && <p className="schedule-tab__error">{submitError}</p>}
      <ul className="schedule-tab__list">
        {timetable.map((item) => {
          const status = itemStatus(item, checkinsByItem)
          const isCurrent = item.id === currentItem?.id
          const checkin = checkinsByItem[item.id]

          if (isLeader && editingItemId === item.id) {
            return (
              <li key={item.id} className="schedule-tab__item">
                <TimetableItemEditForm
                  item={item}
                  hasCheckin={Boolean(checkin)}
                  mapsLoaded={mapsLoaded}
                  onSaved={() => {
                    setEditingItemId(null)
                    refetch()
                  }}
                  onCancel={() => setEditingItemId(null)}
                />
              </li>
            )
          }

          return (
            <li
              key={item.id}
              className={
                'schedule-tab__item' +
                (status === 'done' ? ' is-done' : '') +
                (isCurrent ? ' is-current' : '') +
                (!isCurrent && status === 'pending' ? ' is-upcoming' : '')
              }
            >
              <div className="schedule-tab__item-time">{item.time_planned?.slice(0, 5)}</div>
              <div className="schedule-tab__item-body">
                <div className="schedule-tab__item-place">{item.place_name}</div>
                {item.task && <div className="schedule-tab__item-task">{item.task}</div>}
                {isLeader && (
                  <div className="schedule-tab__item-edit-actions">
                    <button type="button" onClick={() => setEditingItemId(item.id)}>
                      수정
                    </button>
                    <button type="button" onClick={() => handleDeleteItem(item)}>
                      삭제
                    </button>
                  </div>
                )}
                {status === 'done' && (
                  <div className="schedule-tab__item-checked">
                    체크인 완료 · {new Date(checkin.checked_in_at).toLocaleTimeString('ko-KR')}
                  </div>
                )}
                {!isCurrent && status === 'pending' && (
                  <div className="schedule-tab__item-upcoming">예정</div>
                )}
                {isCurrent && (
                  <div className="schedule-tab__item-actions">
                    {photoPreviewUrl && (
                      <img className="schedule-tab__preview" src={photoPreviewUrl} alt="촬영한 사진" />
                    )}
                    <div className="schedule-tab__buttons">
                      <button type="button" onClick={handleTakePhotoClick} disabled={submitting}>
                        {photoFile ? '다시 찍기' : '사진 찍기'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCheckin}
                        disabled={!photoFile || submitting}
                      >
                        {submitting ? '체크인 중...' : '체크인하기'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
