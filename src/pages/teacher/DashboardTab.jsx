import { useMemo, useState } from 'react'
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

  const now = new Date(`1970-01-01T${new Date().toTimeString().slice(0, 8)}`)

  return groups.map((g) => {
    const items = timetableByGroup[g.id] ?? []
    const groupCheckins = (checkinsByGroup[g.id] ?? []).sort(
      (a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at),
    )
    const checkedItemIds = new Set(groupCheckins.map((c) => c.timetable_item_id))

    // 놓친 항목 수: 예정 시각이 지났는데 아직 체크인 안 한 항목의 누적 개수(이력).
    const missedCount = items.filter(
      (t) => !checkedItemIds.has(t.id) && new Date(`1970-01-01T${t.time_planned}`) < now,
    ).length

    // 현재 상태: "지금 시각에 해당하는 일정"(가장 최근에 시작된 항목)에 체크인이
    // 되어 있는지로 판단한다. 앞선 일정을 건너뛰었어도 지금 있어야 할 곳에 있으면
    // 지연으로 보지 않는다 — 목적이 "제시간에 제 위치에 있는지" 확인이기 때문.
    let currentSlotItem = null
    for (const t of items) {
      if (new Date(`1970-01-01T${t.time_planned}`) <= now) currentSlotItem = t
    }
    const isDelayedNow = Boolean(currentSlotItem) && !checkedItemIds.has(currentSlotItem.id)

    const last = groupCheckins[0]
    const lastItem = last && items.find((t) => t.id === last.timetable_item_id)
    return {
      group: g,
      total: items.length,
      done: groupCheckins.length,
      missedCount,
      isDelayedNow,
      lastCheckin: last,
      lastPlace: lastItem?.place_name,
      position: last ?? items.find((t) => t.lat != null && t.lng != null),
    }
  })
}

export default function DashboardTab() {
  const { logout } = useSession()
  const { groups, timetableItems, checkins, loading } = useAllGroupsRealtime()
  const [filter, setFilter] = useState('all')

  const summaries = useMemo(
    () => buildGroupSummaries(groups, timetableItems, checkins),
    [groups, timetableItems, checkins],
  )

  const mapPoints = summaries
    .filter((s) => s.position)
    .map((s) => ({ lat: s.position.lat, lng: s.position.lng, label: s.group.name }))

  const totalGroups = groups.length
  const doneCount = summaries.filter((s) => s.total > 0 && !s.isDelayedNow).length
  const delayedCount = summaries.filter((s) => s.total > 0 && s.isDelayedNow).length

  const filteredSummaries =
    filter === 'done'
      ? summaries.filter((s) => s.total > 0 && !s.isDelayedNow)
      : filter === 'delayed'
        ? summaries.filter((s) => s.total > 0 && s.isDelayedNow)
        : summaries

  if (loading) return <p>불러오는 중...</p>

  return (
    <div className="dashboard-tab">
      <div className="page-header">
        <h1>현황판</h1>
        <button type="button" className="top-action-button" onClick={logout}>
          로그아웃
        </button>
      </div>
      <div className="dashboard-tab__summary">
        <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>
          <strong>{totalGroups}</strong>
          <span>전체 모둠</span>
        </button>
        <button type="button" className={filter === 'done' ? 'is-active' : ''} onClick={() => setFilter('done')}>
          <strong>{doneCount}</strong>
          <span>완료</span>
        </button>
        <button type="button" className={filter === 'delayed' ? 'is-active' : ''} onClick={() => setFilter('delayed')}>
          <strong>{delayedCount}</strong>
          <span>지연</span>
        </button>
      </div>

      <DashboardMap points={mapPoints} />

      <ul className="dashboard-tab__list">
        {filteredSummaries.length === 0 && <li className="dashboard-tab__list-empty">해당하는 모둠이 없습니다.</li>}
        {filteredSummaries.map((s) => (
          <li key={s.group.id}>
            <Link to={`/teacher/dashboard/${s.group.id}`}>
              <div className="dashboard-tab__group-name">{s.group.name}</div>
              <div className="dashboard-tab__group-progress">
                {s.done} / {s.total}
                {s.missedCount > 0 && (
                  <span className="dashboard-tab__group-missed"> · 놓친 일정 {s.missedCount}개</span>
                )}
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
