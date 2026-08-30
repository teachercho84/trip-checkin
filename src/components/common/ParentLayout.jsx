import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { useGroupBundle } from '../../hooks/useGroupBundle'
import BottomTabBar from './BottomTabBar'

const TABS_FOR = (accessCode) => [
  { to: `/p/${accessCode}/schedule`, label: '일정' },
  { to: `/p/${accessCode}/gallery`, label: '갤러리' },
]

/** 학부모용 레이아웃: 교사/학생과 동일하게 하단 탭바로 일정/갤러리를 전환한다. */
export default function ParentLayout() {
  const { accessCode } = useParams()
  const navigate = useNavigate()
  const { bundle, loading, error } = useGroupBundle(accessCode)

  if (!accessCode) return <p>잘못된 접속 링크입니다.</p>
  if (loading) return <p>불러오는 중...</p>
  if (error || !bundle) return <p>모둠을 찾을 수 없습니다.</p>

  return (
    <div className="layout">
      <main className="layout__content parent-view">
        <div className="page-header">
          <h1>{bundle.group.name}</h1>
          <button type="button" className="top-action-button" onClick={() => navigate('/p')}>
            ← 모둠 찾기
          </button>
        </div>
        <p className="group-detail__leader">모둠장 {bundle.group.leader_name}</p>
        {bundle.members?.length > 0 && (
          <p className="group-detail__members">모둠원 {bundle.members.map((m) => m.name).join(', ')}</p>
        )}
        <Outlet context={{ bundle, accessCode }} />
      </main>
      <BottomTabBar tabs={TABS_FOR(accessCode)} />
    </div>
  )
}
