const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function ScheduleIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  )
}

export function RouteIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20 10c0 6.5-8 11.5-8 11.5S4 16.5 4 10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

export function ContactsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M21 15.5v2.9a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 3.3 4.5a1.8 1.8 0 0 1 1.8-2h2.9a1.8 1.8 0 0 1 1.8 1.5c.11.85.32 1.69.63 2.5a1.8 1.8 0 0 1-.4 1.9l-1.2 1.2a14.2 14.2 0 0 0 5.3 5.3l1.2-1.2a1.8 1.8 0 0 1 1.9-.4c.81.31 1.65.52 2.5.63a1.8 1.8 0 0 1 1.5 1.85z" />
    </svg>
  )
}

export function DashboardIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function ItineraryIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8z" />
      <polyline points="14 3 14 8 18.5 8" />
      <line x1="8.5" y1="13" x2="15.5" y2="13" />
      <line x1="8.5" y1="16.5" x2="15.5" y2="16.5" />
    </svg>
  )
}

export function SettingsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M19.1 14.6a1.6 1.6 0 0 0 .32 1.76l.06.06a1.9 1.9 0 1 1-2.68 2.68l-.06-.06a1.6 1.6 0 0 0-1.76-.32 1.6 1.6 0 0 0-.97 1.47V20.4a1.9 1.9 0 0 1-3.8 0v-.09a1.6 1.6 0 0 0-1.04-1.47 1.6 1.6 0 0 0-1.76.32l-.06.06a1.9 1.9 0 1 1-2.68-2.68l.06-.06a1.6 1.6 0 0 0 .32-1.76 1.6 1.6 0 0 0-1.47-.97H3.4a1.9 1.9 0 0 1 0-3.8h.09a1.6 1.6 0 0 0 1.47-1.04 1.6 1.6 0 0 0-.32-1.76l-.06-.06a1.9 1.9 0 1 1 2.68-2.68l.06.06a1.6 1.6 0 0 0 1.76.32H9.1a1.6 1.6 0 0 0 .97-1.47V3.4a1.9 1.9 0 0 1 3.8 0v.09a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.76-.32l.06-.06a1.9 1.9 0 1 1 2.68 2.68l-.06.06a1.6 1.6 0 0 0-.32 1.76V9.1a1.6 1.6 0 0 0 1.47.97h.09a1.9 1.9 0 0 1 0 3.8h-.09a1.6 1.6 0 0 0-1.47.97z" />
    </svg>
  )
}

export function AnnouncementIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 10v4a1.5 1.5 0 0 0 1.5 1.5H6l4.5 4V4.5L6 8.5H4.5A1.5 1.5 0 0 0 3 10z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19.5 5.5a9.5 9.5 0 0 1 0 13" />
    </svg>
  )
}

export const TAB_ICONS = {
  일정: ScheduleIcon,
  경로: RouteIcon,
  연락처: ContactsIcon,
  현황판: DashboardIcon,
  계획서: ItineraryIcon,
  공지사항: AnnouncementIcon,
  설정: SettingsIcon,
}
