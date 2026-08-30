import { Outlet } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'

const TABS = [
  { to: '/student/announcements', label: '공지사항' },
  { to: '/student/schedule', label: '일정' },
  { to: '/student/route', label: '경로' },
  { to: '/student/gallery', label: '갤러리' },
  { to: '/student/contacts', label: '연락처' },
]

export default function StudentLayout() {
  return (
    <div className="layout">
      <main className="layout__content">
        <Outlet />
      </main>
      <BottomTabBar tabs={TABS} />
    </div>
  )
}
