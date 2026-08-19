import { useMemo } from 'react'
import { useSession } from '../../context/SessionContext'
import { useGroupBundle } from '../../hooks/useGroupBundle'
import MapView from '../../components/common/MapView'

export default function RouteTab() {
  const { accessCode } = useSession()
  const { bundle, loading, error } = useGroupBundle(accessCode)

  const { donePoints, upcomingPoints, orderedCheckins } = useMemo(() => {
    if (!bundle) return { donePoints: [], upcomingPoints: [], orderedCheckins: [] }
    const itemsById = Object.fromEntries(bundle.timetable.map((t) => [t.id, t]))
    const ordered = [...bundle.checkins].sort(
      (a, b) => new Date(a.checked_in_at) - new Date(b.checked_in_at),
    )
    const done = ordered.map((c) => ({ lat: c.lat, lng: c.lng }))
    const checkedItemIds = new Set(bundle.checkins.map((c) => c.timetable_item_id))
    const upcoming = bundle.timetable
      .filter((t) => !checkedItemIds.has(t.id) && t.lat != null && t.lng != null)
      .map((t) => ({ lat: t.lat, lng: t.lng }))
    const orderedCheckins = ordered.map((c) => ({ ...c, place: itemsById[c.timetable_item_id]?.place_name }))
    return { donePoints: done, upcomingPoints: upcoming, orderedCheckins }
  }, [bundle])

  if (!accessCode) return <p>접속 코드가 없습니다. 모둠 링크로 다시 접속해주세요.</p>
  if (loading) return <p>불러오는 중...</p>
  if (error) return <p>경로를 불러오지 못했습니다.</p>

  return (
    <div className="route-tab">
      <h1>이동 경로</h1>
      <MapView donePoints={donePoints} upcomingPoints={upcomingPoints} />
      <ol className="route-tab__list">
        {orderedCheckins.map((c, i) => (
          <li key={c.timetable_item_id}>
            {i + 1}. {c.place} · {new Date(c.checked_in_at).toLocaleTimeString('ko-KR')}
          </li>
        ))}
      </ol>
    </div>
  )
}
