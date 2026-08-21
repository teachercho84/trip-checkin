import './CheckinStamp.css'

export default function CheckinStamp({ time }) {
  return (
    <span className="checkin-stamp" role="img" aria-label={`체크인 완료${time ? ' · ' + time : ''}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <polyline points="5 13 10 18 19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {time && <span className="checkin-stamp__time">{time}</span>}
    </span>
  )
}
