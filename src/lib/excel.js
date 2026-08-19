import * as XLSX from 'xlsx'
import { supabase } from './supabaseClient'

const GROUPS_SHEET = '모둠정보'
const TIMETABLE_SHEET = '타임테이블'

/** Parses the uploaded .xlsx (ArrayBuffer) into raw row objects for both sheets. */
export function parseExcelFile(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const groupsSheet = workbook.Sheets[GROUPS_SHEET]
  const timetableSheet = workbook.Sheets[TIMETABLE_SHEET]
  if (!groupsSheet || !timetableSheet) {
    throw new Error(`"${GROUPS_SHEET}"와 "${TIMETABLE_SHEET}" 시트가 모두 필요합니다.`)
  }
  return {
    groupRows: XLSX.utils.sheet_to_json(groupsSheet, { defval: '' }),
    timetableRows: XLSX.utils.sheet_to_json(timetableSheet, { defval: '' }),
  }
}

/** Normalizes raw 모둠정보 rows into structured group objects. */
export function buildGroups(groupRows) {
  return groupRows.map((row) => ({
    name: String(row['모둠명']).trim(),
    leaderName: String(row['모둠장']).trim(),
    leaderStudentId: String(row['학번']).trim(),
    leaderPhone: String(row['모둠장 연락처']).trim(),
    members: String(row['모둠원'] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }))
}

/** Groups raw 타임테이블 rows by 모둠명, in file order (which determines seq). */
export function buildTimetableByGroup(timetableRows) {
  const map = {}
  for (const row of timetableRows) {
    const name = String(row['모둠명']).trim()
    const time = normalizeTime(row['시간'])
    ;(map[name] ??= []).push({
      time,
      place: String(row['장소']).trim(),
      task: String(row['할일'] ?? '').trim() || null,
    })
  }
  return map
}

function normalizeTime(value) {
  if (typeof value === 'number') {
    // Excel stores times as a fraction of a day when the cell is time-formatted.
    const totalMinutes = Math.round(value * 24 * 60)
    const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const m = String(totalMinutes % 60).padStart(2, '0')
    return `${h}:${m}`
  }
  return String(value).trim()
}

/**
 * Compares group names across both sheets so typos that would silently split
 * a group can be caught before writing anything, per spec section 4.1.
 */
export function reconcileGroupNames(groups, timetableByGroup) {
  const groupNames = new Set(groups.map((g) => g.name))
  const timetableNames = new Set(Object.keys(timetableByGroup))
  const common = [...groupNames].filter((n) => timetableNames.has(n))
  const onlyInGroups = [...groupNames].filter((n) => !timetableNames.has(n))
  const onlyInTimetable = [...timetableNames].filter((n) => !groupNames.has(n))
  return { common, onlyInGroups, onlyInTimetable, hasMismatch: onlyInGroups.length > 0 || onlyInTimetable.length > 0 }
}

function geocodeOne(placeName) {
  return new Promise((resolve) => {
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: placeName }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location
        resolve({ lat: loc.lat(), lng: loc.lng(), status: 'ok' })
      } else {
        resolve({ lat: null, lng: null, status: 'failed' })
      }
    })
  })
}

/**
 * Geocodes each unique place name once via the already-loaded Google Maps JS
 * API client (`google.maps.Geocoder`), not a raw fetch to the REST endpoint —
 * the REST endpoint does not send CORS headers, so it cannot be called
 * directly from browser JS. Sequential to stay well under rate limits.
 */
export async function geocodePlaceNames(uniquePlaceNames) {
  const result = {}
  for (const name of uniquePlaceNames) {
    result[name] = await geocodeOne(name)
  }
  return result
}

export function uniquePlaceNames(timetableByGroup) {
  const set = new Set()
  for (const items of Object.values(timetableByGroup)) {
    for (const item of items) set.add(item.place)
  }
  return [...set]
}

/**
 * Uploads all groups (upsert), replacing each group's members/timetable, and
 * provisions a login account for any newly-created group via the
 * `provision-accounts` Edge Function. Runs per-group so one malformed group
 * doesn't roll back the others (per plan section 3).
 */
export async function uploadGroups(groups, timetableByGroup, geocodeResults) {
  const results = []
  for (const group of groups) {
    const items = (timetableByGroup[group.name] ?? []).map((t, i) => ({
      seq: i + 1,
      time: t.time,
      place: t.place,
      task: t.task,
      lat: geocodeResults[t.place]?.lat ?? null,
      lng: geocodeResults[t.place]?.lng ?? null,
      geocode_status: geocodeResults[t.place]?.status ?? 'pending',
    }))

    const { data, error } = await supabase.rpc('replace_group_timetable', {
      p_name: group.name,
      p_leader_name: group.leaderName,
      p_leader_student_id: group.leaderStudentId,
      p_leader_phone: group.leaderPhone,
      p_members: group.members.map((name) => ({ name })),
      p_timetable: items,
    })

    if (error) {
      results.push({ name: group.name, status: 'error', message: error.message })
      continue
    }

    if (data.is_new) {
      const { error: fnError } = await supabase.functions.invoke('provision-accounts', {
        body: { internalCode: data.internal_code, password: group.leaderStudentId },
      })
      if (fnError) {
        results.push({ name: group.name, status: 'account_error', message: fnError.message })
        continue
      }
    }

    const hasFailedGeocode = items.some((it) => it.geocode_status === 'failed')
    results.push({
      name: group.name,
      status: hasFailedGeocode ? 'geocode_failed' : 'ok',
      groupId: data.group_id,
    })
  }
  return results
}
