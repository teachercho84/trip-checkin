import { Outlet } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'

const TABS = [
  { to: '/teacher/dashboard', label: '현황판' },
  { to: '/teacher/itinerary', label: '계획서' },
  { to: '/teacher/announcements', label: '공지사항' },
  { to: '/teacher/settings', label: '설정' },
]

export default function TeacherLayout() {
  return (
    <div className="layout">
      <main className="layout__content">
        <Outlet />
      </main>
      <BottomTabBar tabs={TABS} />
    </div>
  )
}
