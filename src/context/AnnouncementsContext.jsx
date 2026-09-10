import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const LAST_SEEN_KEY = 'p10_announcements_last_seen_at'

const AnnouncementsContext = createContext(null)

/**
 * Loads announcements and keeps them live via a Supabase Realtime subscription
 * on `announcements` INSERTs, so an open announcements tab picks up new posts
 * without a refresh. "Read" state has no server-side account to attach to
 * (students only carry a shared access code), so it's tracked per-device via
 * a single "last seen" timestamp in localStorage.
 */
export function AnnouncementsProvider({ children }) {
  const [announcements, setAnnouncements] = useState([])
  const [lastSeenAt, setLastSeenAt] = useState(() => localStorage.getItem(LAST_SEEN_KEY))

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
      setAnnouncements(data ?? [])
    }
    load()

    const channel = supabase
      .channel('announcements-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
        setAnnouncements((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const isUnread = useCallback(
    (announcement) => !lastSeenAt || new Date(announcement.created_at) > new Date(lastSeenAt),
    [lastSeenAt],
  )

  const markAllRead = useCallback(() => {
    if (announcements.length === 0) return
    const latest = announcements[0].created_at
    localStorage.setItem(LAST_SEEN_KEY, latest)
    setLastSeenAt(latest)
  }, [announcements])

  const value = {
    announcements,
    hasUnread: announcements.some(isUnread),
    isUnread,
    markAllRead,
  }

  return <AnnouncementsContext.Provider value={value}>{children}</AnnouncementsContext.Provider>
}

export function useAnnouncements() {
  const ctx = useContext(AnnouncementsContext)
  if (!ctx) throw new Error('useAnnouncements must be used within AnnouncementsProvider')
  return ctx
}
