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
    const overdueCount = items.filter(
      (t) => !checkedItemIds.has(t.id) && new Date(`1970-01-01T${t.time_planned}`) < now,
    ).length
    const last = groupCheckins[0]
    const lastItem = last && items.find((t) => t.id === last.timetable_item_id)
    return {
      group: g,
      total: items.length,
      done: groupCheckins.length,
      overdueCount,
      lastCheckin: last,
      lastPlace: lastItem?.place_name,
      position: last ?? items.find((t) => t.lat != null && t.lng != null),
    }
  })
}

export default function DashboardTab() {
  const { logout } = useSession()
  const { groups, timetableItems, checkins, loading } = useAllGroupsRealtime()
  const [parentLinkCopied, setParentLinkCopied] = useState(false)
  const [filter, setFilter] = useState('all')

  async function handleCopyParentLink() {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}#/p`
    await navigator.clipboard.writeText(link)
    setParentLinkCopied(true)
    setTimeout(() => setParentLinkCopied(false), 2000)
  }

  const summaries = useMemo(
    () => buildGroupSummaries(groups, timetableItems, checkins),
    [groups, timetableItems, checkins],
  )

  const mapPoints = summaries
    .filter((s) => s.position)
    .map((s) => ({ lat: s.position.lat, lng: s.position.lng, label: s.group.name }))

  const totalGroups = groups.length
  const doneCount = summaries.filter((s) => s.total > 0 && s.overdueCount === 0).length
  const delayedCount = summaries.filter((s) => s.total > 0 && s.overdueCount > 0).length

  const filteredSummaries =
    filter === 'done'
      ? summaries.filter((s) => s.total > 0 && s.overdueCount === 0)
      : filter === 'delayed'
        ? summaries.filter((s) => s.total > 0 && s.overdueCount > 0)
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
      <div className="group-detail__parent-link">
        <span className="group-detail__parent-link-label">학부모 공용 링크 (전체 모둠 공용, 1개)</span>
        <div className="group-detail__parent-link-row">
          <input readOnly value={`${window.location.origin}${import.meta.env.BASE_URL}#/p`} onFocus={(e) => e.target.select()} />
          <button type="button" className="top-action-button" onClick={handleCopyParentLink}>
            {parentLinkCopied ? '복사됨' : '복사'}
          </button>
        </div>
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
