import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Teacher dashboard data source: all groups, their timetables, and all
 * check-ins, kept live via a Supabase Realtime subscription on `checkins`
 * INSERTs and UPDATEs (students can re-check-in, which overwrites the
 * existing row). RLS restricts all of this to authenticated teachers.
 */
export function useAllGroupsRealtime() {
  const [groups, setGroups] = useState([])
  const [timetableItems, setTimetableItems] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [groupsRes, timetableRes, checkinsRes] = await Promise.all([
      supabase.from('groups').select('id, name, leader_name, leader_phone'),
      supabase.from('timetable_items').select('*').order('seq'),
      supabase.from('checkins').select('*'),
    ])
    setGroups(groupsRes.data ?? [])
    setTimetableItems(timetableRes.data ?? [])
    setCheckins(checkinsRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()

    const channel = supabase
      .channel('checkins-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins' }, (payload) => {
        setCheckins((prev) => [...prev, payload.new])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'checkins' }, (payload) => {
        setCheckins((prev) => prev.map((c) => (c.id === payload.new.id ? payload.new : c)))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadAll])

  return { groups, timetableItems, checkins, loading, refetch: loadAll }
}
