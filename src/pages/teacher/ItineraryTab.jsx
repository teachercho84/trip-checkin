import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAllGroupsRealtime } from '../../hooks/useAllGroupsRealtime'

export default function ItineraryTab() {
  const { groups, timetableItems, loading } = useAllGroupsRealtime()
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) setSelectedGroupId(groups[0].id)
  }, [groups, selectedGroupId])

  useEffect(() => {
    if (!selectedGroupId) return
    supabase
      .from('group_members')
      .select('name')
      .eq('group_id', selectedGroupId)
      .then(({ data }) => setMembers(data ?? []))
  }, [selectedGroupId])

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)
  const items = timetableItems
    .filter((t) => t.group_id === selectedGroupId)
    .sort((a, b) => a.seq - b.seq)

  if (loading) return <p>불러오는 중...</p>

  return (
    <div className="itinerary-tab">
      <h1>계획서</h1>
      <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      {selectedGroup && (
        <div className="itinerary-tab__header">
          <p>
            모둠장 {selectedGroup.leader_name} · {selectedGroup.leader_phone}
          </p>
          <p>모둠원 {members.map((m) => m.name).join(', ')}</p>
        </div>
      )}

      <ul className="itinerary-tab__list">
        {items.map((item) => (
          <li key={item.id}>
            <span className="itinerary-tab__time">{item.time_planned?.slice(0, 5)}</span>
            <span>{item.place_name}</span>
            {item.task && <span className="itinerary-tab__task"> — {item.task}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
