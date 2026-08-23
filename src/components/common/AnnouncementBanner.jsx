import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './AnnouncementBanner.css'

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setAnnouncement(data ?? null)
    }
    load()
  }, [])

  if (!announcement) return null

  return (
    <div className="announcement-banner">
      <strong>{announcement.title}</strong>
      <p>{announcement.body}</p>
    </div>
  )
}
