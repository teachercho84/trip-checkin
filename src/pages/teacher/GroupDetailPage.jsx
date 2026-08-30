import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAllGroupsRealtime } from '../../hooks/useAllGroupsRealtime'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'
import { getCheckinPhotoUrl } from '../../lib/checkin'
import TimetableItemEditForm, { deleteTimetableItem } from '../../components/common/TimetableItemEditForm'
import MapView from '../../components/common/MapView'
import CheckinStamp from '../../components/common/CheckinStamp'

export default function GroupDetailPage() {
  const { groupId } = useParams()
  const mapsLoaded = useGoogleMapsLoaded()
  const { groups, timetableItems, checkins, loading, refetch } = useAllGroupsRealtime()
  const [editingItemId, setEditingItemId] = useState(null)
  const [adding, setAdding] = useState(false)

  const group = groups.find((g) => g.id === groupId)
  const items = useMemo(
    () => timetableItems.filter((t) => t.group_id === groupId).sort((a, b) => a.seq - b.seq),
    [timetableItems, groupId],
  )
  const checkinsByItem = useMemo(() => {
    const map = {}
    for (const c of checkins) if (c.group_id === groupId) map[c.timetable_item_id] = c
    return map
  }, [checkins, groupId])

  const donePoints = items
    .filter((t) => checkinsByItem[t.id])
    .sort((a, b) => new Date(checkinsByItem[a.id].checked_in_at) - new Date(checkinsByItem[b.id].checked_in_at))
    .map((t) => ({ lat: checkinsByItem[t.id].lat, lng: checkinsByItem[t.id].lng }))
  const upcomingPoints = items
    .filter((t) => !checkinsByItem[t.id] && t.lat != null && t.lng != null)
    .map((t) => ({ lat: t.lat, lng: t.lng }))

  async function handleDeleteItem(item) {
    const deleted = await deleteTimetableItem(item, Boolean(checkinsByItem[item.id]))
    if (deleted) refetch()
  }

  if (loading) return <p>불러오는 중...</p>
  if (!group) return <p>모둠을 찾을 수 없습니다.</p>

  return (
    <div className="group-detail">
      <div className="page-header">
        <h1>{group.name}</h1>
        <Link to="/teacher/dashboard" className="top-action-button">
          ← 현황판
        </Link>
      </div>
      <p className="group-detail__leader">
        모둠장 {group.leader_name} · {group.leader_phone}
      </p>

      <MapView donePoints={donePoints} upcomingPoints={upcomingPoints} />

      <ul className="group-detail__timeline">
        {items.map((item) => {
          const checkin = checkinsByItem[item.id]
          const isLate =
            !checkin && new Date(`1970-01-01T${item.time_planned}`) < new Date(`1970-01-01T${new Date().toTimeString().slice(0, 8)}`)

          if (editingItemId === item.id) {
            return (
              <li key={item.id}>
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
              className={checkin ? 'is-done' : isLate ? 'is-delayed' : 'is-upcoming'}
            >
              <span className="group-detail__timeline-time">{item.time_planned?.slice(0, 5)}</span>
              <span>{item.place_name}</span>
              {checkin && (
                <CheckinStamp
                  time={new Date(checkin.checked_in_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
              )}
              {checkin?.photo_path && (
                <a
                  href={getCheckinPhotoUrl(checkin.photo_path, checkin.checked_in_at)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    className="group-detail__timeline-photo"
                    src={getCheckinPhotoUrl(checkin.photo_path, checkin.checked_in_at)}
                    alt="체크인 사진"
                  />
                </a>
              )}
              <span className="group-detail__timeline-item-actions">
                <button type="button" onClick={() => setEditingItemId(item.id)}>
                  수정
                </button>
                <button type="button" onClick={() => handleDeleteItem(item)}>
                  삭제
                </button>
              </span>
            </li>
          )
        })}
      </ul>
      <div className="group-detail__add">
        {adding ? (
          <TimetableItemEditForm
            groupId={group.id}
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
    </div>
  )
}
