import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { useAllGroupsSummary } from '../hooks/useAllGroupsSummary'

/** Public group picker for students: search by group or leader/member name, tap to enter. */
export default function StudentGroupListPage() {
  const navigate = useNavigate()
  const { setAccessCode } = useSession()
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

  function handleSelect(group) {
    setAccessCode(group.access_code)
    navigate('/student/schedule')
  }

  return (
    <div className="parent-view parent-group-list">
      <h1>영산고 문화체험여행</h1>
      <p className="parent-group-list__title-sub">내 모둠 찾기</p>
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
            <a href="#" onClick={(e) => { e.preventDefault(); handleSelect(g) }}>
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
