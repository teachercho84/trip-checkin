import { useMemo } from 'react'
import { useSession } from '../../context/SessionContext'
import { useGroupBundle } from '../../hooks/useGroupBundle'
import { getCheckinPhotoUrl } from '../../lib/checkin'
import './StampsTab.css'

export default function StampsTab() {
  const { accessCode } = useSession()
  const { bundle, loading, error } = useGroupBundle(accessCode)

  const { timetable, checkinsByItem, doneCount } = useMemo(() => {
    if (!bundle) return { timetable: [], checkinsByItem: {}, doneCount: 0 }
    const checkinsByItem = {}
    for (const c of bundle.checkins) checkinsByItem[c.timetable_item_id] = c
    return { timetable: bundle.timetable, checkinsByItem, doneCount: bundle.checkins.length }
  }, [bundle])

  if (!accessCode) return <p>접속 코드가 없습니다. 모둠 링크로 다시 접속해주세요.</p>
  if (loading) return <p>불러오는 중...</p>
  if (error) return <p>도장판을 불러오지 못했습니다.</p>

  return (
    <div className="stamps-tab">
      <h1>도장판</h1>
      <p className="stamps-tab__summary">
        {doneCount} / {timetable.length}개 도장 획득
      </p>
      <div className="stamps-tab__grid">
        {timetable.map((item) => {
          const checkin = checkinsByItem[item.id]
          const done = Boolean(checkin)
          return (
            <div key={item.id} className={'stamps-tab__card' + (done ? ' is-done' : '')}>
              <div className="stamps-tab__stamp">
                {done && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <polyline
                      points="5 13 10 18 19 7"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className="stamps-tab__place">{item.place_name}</div>
              {done && (
                <div className="stamps-tab__time">
                  {new Date(checkin.checked_in_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              {done && checkin.photo_path && (
                <img
                  className="stamps-tab__photo"
                  src={getCheckinPhotoUrl(checkin.photo_path)}
                  alt="체크인 사진"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
