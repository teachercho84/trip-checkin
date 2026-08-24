import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllGroupsSummary } from '../hooks/useAllGroupsSummary'

/** Public group picker for parents: search by group or leader name, tap to view. */
export default function ParentGroupListPage() {
  const navigate = useNavigate()
  const { groups, loading, error } = useAllGroupsSummary()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return groups
    return groups.filter(
      (g) =>
        g.name.includes(q) ||
        g.leader_name?.includes(q) ||
        g.member_names?.some((name) => name.includes(q)),
    )
  }, [groups, query])

  if (loading) return <p>불러오는 중...</p>
  if (error) return <p>모둠 목록을 불러올 수 없습니다.</p>

  return (
    <div className="parent-view parent-group-list">
      <h1>
        <span className="parent-group-list__title-sub">영산고 문화체험여행</span>
        <br />
        우리 아이 모둠 찾기
      </h1>
      <input
        className="parent-group-list__search"
        type="text"
        placeholder="모둠명, 모둠장, 모둠원 이름으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="dashboard-tab__list">
        {filtered.map((g) => (
          <li key={g.id}>
            <a href={`#/p/${g.access_code}`} onClick={(e) => { e.preventDefault(); navigate(`/p/${g.access_code}`) }}>
              <div className="dashboard-tab__group-name">{g.name}</div>
              <div className="dashboard-tab__group-progress">
                모둠장 {g.leader_name}
                {g.member_names?.length > 0 && <> · 모둠원 {g.member_names.join(', ')}</>}
              </div>
            </a>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p>검색 결과가 없습니다.</p>}
    </div>
  )
}
