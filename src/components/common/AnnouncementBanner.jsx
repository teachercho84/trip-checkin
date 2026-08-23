import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { AnnouncementIcon } from './TabIcons'
import './AnnouncementBanner.css'

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
      setAnnouncements(data ?? [])
    }
    load()
  }, [])

  if (announcements.length === 0) return null

  return (
    <div className="announcement-banner-list">
      {announcements.map((a) => (
        <div className="announcement-banner" key={a.id}>
          <div className="announcement-banner__label">
            <AnnouncementIcon />
            <span>공지</span>
          </div>
          <strong>{a.title}</strong>
          <p>{a.body}</p>
        </div>
      ))}
    </div>
  )
}
