import { useMemo, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import { useGroupBundle } from '../../hooks/useGroupBundle'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'
import { performCheckin, getCheckinPhotoUrl } from '../../lib/checkin'
import TimetableItemEditForm, { deleteTimetableItem } from '../../components/common/TimetableItemEditForm'
import CameraCapture from '../../components/common/CameraCapture'
import CheckinStamp from '../../components/common/CheckinStamp'
import './ScheduleTab.css'

function itemStatus(item, checkinsByItem) {
  return checkinsByItem[item.id] ? 'done' : 'pending'
}

export default function ScheduleTab() {
  const { accessCode, role, logout } = useSession()
  const isLeader = role === 'leader'
  const mapsLoaded = useGoogleMapsLoaded()
  const { bundle, loading, error, refetch } = useGroupBundle(accessCode)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const [retryItemId, setRetryItemId] = useState(null)

  const checkinsByItem = useMemo(() => {
    const map = {}
    for (const c of bundle?.checkins ?? []) map[c.timetable_item_id] = c
    return map
  }, [bundle])

  const timetable = bundle?.timetable ?? []
  const currentItem = timetable.find((item) => itemStatus(item, checkinsByItem) === 'pending')

  function handlePhotoCapture(blob) {
    setPhotoFile(blob)
    setPhotoPreviewUrl(URL.createObjectURL(blob))
    setCameraOpen(false)
  }

  async function handleCheckin(itemId) {
    if (!itemId || !photoFile) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await performCheckin({
        accessCode,
        groupId: bundle.group.id,
        timetableItemId: itemId,
        photoFile,
      })
      setPhotoFile(null)
      setPhotoPreviewUrl(null)
      setRetryItemId(null)
      await refetch()
    } catch (err) {
      setSubmitError(err.message ?? '체크인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleStartRetry(item) {
    if (!window.confirm('다시 체크인하면 이전 사진은 사라져요. 계속할까요?')) return
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
    setCameraOpen(false)
    setSubmitError('')
    setRetryItemId(item.id)
  }

  function handleCancelRetry() {
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
    setCameraOpen(false)
    setRetryItemId(null)
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
      <div className="page-header">
        <h1>{bundle.group.name} 일정</h1>
        <button type="button" className="top-action-button" onClick={logout}>
          로그아웃
        </button>
      </div>
      {submitError && <p className="schedule-tab__error">{submitError}</p>}
      <ul className="schedule-tab__list">
        {timetable.map((item) => {
          const status = itemStatus(item, checkinsByItem)
          const isCurrent = item.id === currentItem?.id
          const checkin = checkinsByItem[item.id]
          const isRetrying = retryItemId === item.id
          const showCheckinAction = isCurrent || isRetrying

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
                {status === 'done' && !isRetrying && (
                  <>
                    <CheckinStamp
                      time={new Date(checkin.checked_in_at).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    />
                    {checkin.photo_path && (
                      <div className="schedule-tab__item-checked">
                        <a
                          href={getCheckinPhotoUrl(checkin.photo_path, checkin.checked_in_at)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            className="schedule-tab__checked-photo"
                            src={getCheckinPhotoUrl(checkin.photo_path, checkin.checked_in_at)}
                            alt="체크인 사진"
                          />
                        </a>
                      </div>
                    )}
                    <div className="schedule-tab__item-edit-actions">
                      <button type="button" onClick={() => handleStartRetry(item)}>
                        다시 체크인
                      </button>
                    </div>
                  </>
                )}
                {!isCurrent && status === 'pending' && (
                  <div className="schedule-tab__item-upcoming">예정</div>
                )}
                {showCheckinAction && (
                  <div className="schedule-tab__item-actions">
                    {cameraOpen ? (
                      <CameraCapture onCapture={handlePhotoCapture} onCancel={() => setCameraOpen(false)} />
                    ) : (
                      <>
                        {photoPreviewUrl && (
                          <img className="schedule-tab__preview" src={photoPreviewUrl} alt="촬영한 사진" />
                        )}
                        <div className="schedule-tab__buttons">
                          <button type="button" onClick={() => setCameraOpen(true)} disabled={submitting}>
                            {photoFile ? '다시 찍기' : '사진 찍기'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCheckin(item.id)}
                            disabled={!photoFile || submitting}
                          >
                            {submitting ? '체크인 중...' : '체크인하기'}
                          </button>
                          {isRetrying && (
                            <button type="button" onClick={handleCancelRetry} disabled={submitting}>
                              취소
                            </button>
                          )}
                        </div>
                      </>
                    )}
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
