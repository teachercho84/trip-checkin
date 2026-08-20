import { Outlet } from 'react-router-dom'
import { useSession } from '../../context/SessionContext'
import BottomTabBar from './BottomTabBar'

const TABS = [
  { to: '/student/schedule', label: '일정' },
  { to: '/student/route', label: '경로' },
  { to: '/student/contacts', label: '연락처' },
]

export default function StudentLayout() {
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
