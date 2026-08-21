import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAllGroupsRealtime } from '../../hooks/useAllGroupsRealtime'
import { useSession } from '../../context/SessionContext'
import DashboardMap from '../../components/teacher/DashboardMap'

function buildGroupSummaries(groups, timetableItems, checkins) {
  const timetableByGroup = {}
  for (const t of timetableItems) {
    ;(timetableByGroup[t.group_id] ??= []).push(t)
  }
  const checkinsByGroup = {}
  for (const c of checkins) {
    ;(checkinsByGroup[c.group_id] ??= []).push(c)
  }

  return groups.map((g) => {
    const items = timetableByGroup[g.id] ?? []
    const groupCheckins = (checkinsByGroup[g.id] ?? []).sort(
      (a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at),
    )
    const last = groupCheckins[0]
    const lastItem = last && items.find((t) => t.id === last.timetable_item_id)
    return {
      group: g,
      total: items.length,
      done: groupCheckins.length,
      lastCheckin: last,
      lastPlace: lastItem?.place_name,
      position: last ?? items.find((t) => t.lat != null && t.lng != null),
    }
  })
}

export default function DashboardTab() {
  const { logout } = useSession()
  const { groups, timetableItems, checkins, loading } = useAllGroupsRealtime()

  const summaries = useMemo(
    () => buildGroupSummaries(groups, timetableItems, checkins),
    [groups, timetableItems, checkins],
  )

  const mapPoints = summaries
    .filter((s) => s.position)
    .map((s) => ({ lat: s.position.lat, lng: s.position.lng, label: s.group.name }))

  const totalGroups = groups.length
  const doneCount = summaries.filter((s) => s.total > 0 && s.done >= s.total).length
  const delayedCount = summaries.filter((s) => s.total > 0 && s.done < s.total && s.done === 0).length

  if (loading) return <p>불러오는 중...</p>

  return (
    <div className="dashboard-tab">
      <div className="dashboard-tab__header">
        <h1>현황판</h1>
        <button type="button" className="dashboard-tab__logout-button" onClick={logout}>
          로그아웃
        </button>
      </div>
      <div className="dashboard-tab__summary">
        <div>
          <strong>{totalGroups}</strong>
          <span>전체 모둠</span>
        </div>
        <div>
          <strong>{doneCount}</strong>
          <span>완료</span>
        </div>
        <div>
          <strong>{delayedCount}</strong>
          <span>지연</span>
        </div>
      </div>

      <DashboardMap points={mapPoints} />

      <ul className="dashboard-tab__list">
        {summaries.map((s) => (
          <li key={s.group.id}>
            <Link to={`/teacher/dashboard/${s.group.id}`}>
              <div className="dashboard-tab__group-name">{s.group.name}</div>
              <div className="dashboard-tab__group-progress">
                {s.done} / {s.total}
                {s.lastCheckin && (
                  <span>
                    {' '}
                    · {s.lastPlace} {new Date(s.lastCheckin.checked_in_at).toLocaleTimeString('ko-KR')}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
