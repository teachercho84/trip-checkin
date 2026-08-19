import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAllGroupsRealtime } from '../../hooks/useAllGroupsRealtime'
import MapView from '../../components/common/MapView'

export default function GroupDetailPage() {
  const { groupId } = useParams()
  const { groups, timetableItems, checkins, loading } = useAllGroupsRealtime()

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

  if (loading) return <p>불러오는 중...</p>
  if (!group) return <p>모둠을 찾을 수 없습니다.</p>

  return (
    <div className="group-detail">
      <Link to="/teacher/dashboard">← 현황판으로</Link>
      <h1>{group.name}</h1>
      <p className="group-detail__leader">
        모둠장 {group.leader_name} · {group.leader_phone}
      </p>

      <MapView donePoints={donePoints} upcomingPoints={upcomingPoints} />

      <ul className="group-detail__timeline">
        {items.map((item) => {
          const checkin = checkinsByItem[item.id]
          const isLate =
            !checkin && new Date(`1970-01-01T${item.time_planned}`) < new Date(`1970-01-01T${new Date().toTimeString().slice(0, 8)}`)
          return (
            <li
              key={item.id}
              className={checkin ? 'is-done' : isLate ? 'is-delayed' : 'is-upcoming'}
            >
              <span className="group-detail__timeline-time">{item.time_planned?.slice(0, 5)}</span>
              <span>{item.place_name}</span>
              {checkin && (
                <span className="group-detail__timeline-actual">
                  실제 {new Date(checkin.checked_in_at).toLocaleTimeString('ko-KR')}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
