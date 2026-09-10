import { NavLink } from 'react-router-dom'
import { TAB_ICONS } from './TabIcons'
import './BottomTabBar.css'

export default function BottomTabBar({ tabs }) {
  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => {
        const Icon = TAB_ICONS[tab.label]
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => 'bottom-tab-bar__item' + (isActive ? ' is-active' : '')}
          >
            <span className="bottom-tab-bar__pill">
              <span className="bottom-tab-bar__icon-wrap">
                {Icon && <Icon />}
                {tab.badge && <span className="bottom-tab-bar__badge" aria-label="읽지 않은 알림" />}
              </span>
              <span>{tab.label}</span>
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
