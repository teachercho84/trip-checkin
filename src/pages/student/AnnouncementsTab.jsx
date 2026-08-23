import AnnouncementBanner from '../../components/common/AnnouncementBanner'

export default function AnnouncementsTab() {
  return (
    <div className="announcements-tab">
      <div className="page-header">
        <h1>공지사항</h1>
      </div>
      <AnnouncementBanner />
    </div>
  )
}
