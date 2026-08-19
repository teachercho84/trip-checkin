import { NavLink } from 'react-router-dom'
import './BottomTabBar.css'

export default function BottomTabBar({ tabs }) {
  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => 'bottom-tab-bar__item' + (isActive ? ' is-active' : '')}
        >
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
