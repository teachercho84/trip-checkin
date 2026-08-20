import { Outlet } from 'react-router-dom'
import { useSession } from '../../context/SessionContext'
import BottomTabBar from './BottomTabBar'

const TABS = [
  { to: '/teacher/dashboard', label: '현황판' },
  { to: '/teacher/itinerary', label: '계획서' },
  { to: '/teacher/settings', label: '설정' },
]

export default function TeacherLayout() {
  const { logout } = useSession()

  return (
    <div className="layout">
      <header className="layout__header">
        <button type="button" className="layout__logout-button" onClick={logout}>
          로그아웃
        </button>
      </header>
      <main className="layout__content">
        <Outlet />
      </main>
      <BottomTabBar tabs={TABS} />
    </div>
  )
}
