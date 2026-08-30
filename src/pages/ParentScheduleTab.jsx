import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getCheckinPhotoUrl } from '../lib/checkin'
import MapView from '../components/common/MapView'
import CheckinStamp from '../components/common/CheckinStamp'

/** 학부모용 일정/지도 탭 (읽기 전용, 체크인/수정 액션 없음). */
export default function ParentScheduleTab() {
  const { bundle } = useOutletContext()

  const { items, checkinsByItem, donePoints, upcomingPoints } = useMemo(() => {
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

  return (
    <>
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
            </li>
          )
        })}
      </ul>
    </>
  )
}
