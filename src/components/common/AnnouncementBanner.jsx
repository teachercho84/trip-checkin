import { useEffect } from 'react'
import { AnnouncementIcon } from './TabIcons'
import { useAnnouncements } from '../../context/AnnouncementsContext'
import './AnnouncementBanner.css'

export default function AnnouncementBanner() {
  const { announcements, isUnread, markAllRead } = useAnnouncements()

  // 학생이 이 탭을 열어 목록을 보는 시점 = 읽은 것으로 처리.
  useEffect(() => {
    markAllRead()
  }, [announcements, markAllRead])

  if (announcements.length === 0) return <p>등록된 공지사항이 없습니다.</p>

  return (
    <div className="announcement-banner-list">
      {announcements.map((a) => (
        <div className="announcement-banner" key={a.id}>
          <div className="announcement-banner__label">
            <AnnouncementIcon />
            <span>공지</span>
            {isUnread(a) && <span className="announcement-banner__new">NEW</span>}
          </div>
          <strong>{a.title}</strong>
          <p>{a.body}</p>
        </div>
      ))}
    </div>
  )
}
