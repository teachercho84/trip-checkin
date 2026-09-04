import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const mapsLoaded = useGoogleMapsLoaded()
  const { bundle, loading, error, refetch } = useGroupBundle(accessCode)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const [activeItemId, setActiveItemId] = useState(null)
  const [adding, setAdding] = useState(false)

  const checkinsByItem = useMemo(() => {
    const map = {}
    for (const c of bundle?.checkins ?? []) map[c.timetable_item_id] = c
    return map
  }, [bundle])

  const timetable = bundle?.timetable ?? []

  // 순서와 무관하게 아무 항목이나 체크인할 수 있다. 다만 "지금 이 시간대에 체크인해야
  // 할 항목"을 안내하기 위해, 아직 체크인 안 됐고 예정 시각이 이미 지난 항목 중
  // 가장 최근 것을 활성 항목으로 표시한다 (앞선 일정을 건너뛰었어도 최신 것을 우선 안내).
  const now = new Date(`1970-01-01T${new Date().toTimeString().slice(0, 8)}`)
  let activeTimeItemId = null
  for (const item of timetable) {
    if (checkinsByItem[item.id]) continue
    if (new Date(`1970-01-01T${item.time_planned}`) <= now) activeTimeItemId = item.id
  }

  function handlePhotoCapture(blob) {
    setPhotoFile(blob)
    setPhotoPreviewUrl(URL.createObjectURL(blob))
    setCameraOpen(false)
  }

  // 모둠장은 이름+비밀번호로 로그인하므로 로그인 화면(/)으로, 일반 학생은 접속코드만
  // 있는 상태라 모둠을 다시 찾는 공용 페이지(/s)로 보낸다.
  async function handleLogout() {
    const wasLeader = isLeader
    await logout()
    navigate(wasLeader ? '/' : '/s')
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
      setActiveItemId(null)
      await refetch()
    } catch (err) {
      setSubmitError(err.message ?? '체크인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleStartCapture(itemId) {
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
    setSubmitError('')
    setActiveItemId(itemId)
    setCameraOpen(true)
  }

  function handleStartRetry(item) {
    if (!window.confirm('다시 체크인하면 이전 사진은 사라져요. 계속할까요?')) return
    handleStartCapture(item.id)
  }

  function handleCancelCapture() {
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
    setCameraOpen(false)
    setActiveItemId(null)
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
        <button type="button" className="top-action-button" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
      {submitError && <p className="schedule-tab__error">{submitError}</p>}
      <ul className="schedule-tab__list">
        {timetable.map((item) => {
          const status = itemStatus(item, checkinsByItem)
          const isActiveTime = item.id === activeTimeItemId
          const isPastDue = status === 'pending' && new Date(`1970-01-01T${item.time_planned}`) <= now
          const checkin = checkinsByItem[item.id]
          const isCapturing = activeItemId === item.id

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
                (isActiveTime && status === 'pending' ? ' is-current' : '') +
                (status === 'pending' && !isPastDue ? ' is-upcoming' : '')
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
                {status === 'done' && !isCapturing && (
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
                {status === 'pending' && !isPastDue && (
                  <div className="schedule-tab__item-upcoming">예정</div>
                )}
                {status === 'pending' && isPastDue && !isCapturing && (
                  <div className="schedule-tab__item-actions">
                    <button type="button" onClick={() => handleStartCapture(item.id)}>
                      사진 찍기
                    </button>
                  </div>
                )}
                {isCapturing && (
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
                          <button type="button" onClick={handleCancelCapture} disabled={submitting}>
                            취소
                          </button>
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
      {isLeader && (
        <div className="schedule-tab__add">
          {adding ? (
            <TimetableItemEditForm
              groupId={bundle.group.id}
              mapsLoaded={mapsLoaded}
              onSaved={() => {
                setAdding(false)
                refetch()
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button type="button" className="top-action-button" onClick={() => setAdding(true)}>
              일정 추가
            </button>
          )}
        </div>
      )}
    </div>
  )
}
