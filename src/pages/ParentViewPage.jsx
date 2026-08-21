import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useGroupBundle } from '../hooks/useGroupBundle'
import { getCheckinPhotoUrl } from '../lib/checkin'
import MapView from '../components/common/MapView'
import CheckinStamp from '../components/common/CheckinStamp'

/** Read-only status page for parents: no login, no check-in/edit actions. */
export default function ParentViewPage() {
  const { accessCode } = useParams()
  const { bundle, loading, error } = useGroupBundle(accessCode)

  const { items, checkinsByItem, donePoints, upcomingPoints } = useMemo(() => {
    if (!bundle) return { items: [], checkinsByItem: {}, donePoints: [], upcomingPoints: [] }
    const checkinsByItem = {}
    for (const c of bundle.checkins) checkinsByItem[c.timetable_item_id] = c
    const items = bundle.timetable
    const donePoints = items
      .filter((t) => checkinsByItem[t.id])
      .sort((a, b) => new Date(checkinsByItem[a.id].checked_in_at) - new Date(checkinsByItem[b.id].checked_in_at))
      .map((t) => ({ lat: checkinsByItem[t.id].lat, lng: checkinsByItem[t.id].lng }))
    const upcomingPoints = items
      .filter((t) => !checkinsByItem[t.id] && t.lat != null && t.lng != null)
      .map((t) => ({ lat: t.lat, lng: t.lng }))
    return { items, checkinsByItem, donePoints, upcomingPoints }
  }, [bundle])

  if (!accessCode) return <p>잘못된 접속 링크입니다.</p>
  if (loading) return <p>불러오는 중...</p>
  if (error || !bundle) return <p>모둠을 찾을 수 없습니다.</p>

  return (
    <div className="group-detail parent-view">
      <h1>{bundle.group.name}</h1>
      <p className="group-detail__leader">모둠장 {bundle.group.leader_name}</p>

      <MapView donePoints={donePoints} upcomingPoints={upcomingPoints} />

      <ul className="group-detail__timeline">
        {items.map((item) => {
          const checkin = checkinsByItem[item.id]
          return (
            <li key={item.id} className={checkin ? 'is-done' : 'is-upcoming'}>
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
                <a href={getCheckinPhotoUrl(checkin.photo_path)} target="_blank" rel="noreferrer">
                  <img
                    className="group-detail__timeline-photo"
                    src={getCheckinPhotoUrl(checkin.photo_path)}
                    alt="체크인 사진"
                  />
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
