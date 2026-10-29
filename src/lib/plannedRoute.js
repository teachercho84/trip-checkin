/**
 * Splits a group's timetable items (already in schedule order) into the points
 * that can be drawn on the map and the ones without coordinates.
 * `checkedItemIds` is a Set of timetable item ids that have a check-in.
 */
export function buildPlannedRoute(items, checkedItemIds) {
  const plannedPoints = []
  const unmappedItems = []
  for (const t of items) {
    if (t.lat != null && t.lng != null) {
      plannedPoints.push({ lat: t.lat, lng: t.lng, done: checkedItemIds.has(t.id) })
    } else {
      unmappedItems.push(t)
    }
  }
  return { plannedPoints, unmappedItems }
}
