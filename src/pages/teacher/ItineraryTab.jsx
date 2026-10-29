import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAllGroupsRealtime } from '../../hooks/useAllGroupsRealtime'
import MapView from '../../components/common/MapView'

export default function ItineraryTab() {
  const { groups, timetableItems, checkins, loading } = useAllGroupsRealtime()
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

  const checkedItemIds = new Set(checkins.map((c) => c.timetable_item_id))
  const mappableItems = items.filter((t) => t.lat != null && t.lng != null)
  const unmappedItems = items.filter((t) => t.lat == null || t.lng == null)
  const plannedPoints = mappableItems.map((t) => ({
    lat: t.lat,
    lng: t.lng,
    done: checkedItemIds.has(t.id),
  }))

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
            모둠장 {selectedGroup.leader_name} ·{' '}
            <a href={`tel:${selectedGroup.leader_phone?.replace(/-/g, '')}`}>{selectedGroup.leader_phone}</a>
          </p>
          <p>모둠원 {members.map((m) => m.name).join(', ')}</p>
        </div>
      )}

      {selectedGroup &&
        (plannedPoints.length > 0 ? (
          <MapView plannedPoints={plannedPoints} />
        ) : (
          <p className="itinerary-tab__map-note">지도에 표시할 수 있는 장소가 없습니다.</p>
        ))}
      {unmappedItems.length > 0 && plannedPoints.length > 0 && (
        <p className="itinerary-tab__map-note">
          지도에 표시되지 않은 장소: {unmappedItems.map((t) => t.place_name).join(', ')}
        </p>
      )}

      <ul className="itinerary-tab__list">
        {items.map((item) => (
          <li key={item.id}>
            <span className="itinerary-tab__time">{item.time_planned?.slice(0, 5)}</span>
            {checkedItemIds.has(item.id) && <span className="itinerary-tab__done">✓ </span>}
            <span>{item.place_name}</span>
            {item.task && <span className="itinerary-tab__task"> — {item.task}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
