import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

// 저장된 접속코드가 더 이상 유효하지 않으면(모둠 삭제/재생성 등) 자동으로
// 로그아웃하고 초기 화면으로 돌려보낸다. 그대로 두면 로그인 화면(/)이 role만
// 보고 무조건 /student/schedule로 다시 튕겨보내서, 에러 화면에서 빠져나올
// 방법이 없어진다.
export function useInvalidAccessCodeRecovery(error) {
  const { role, logout } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!error?.message?.includes('invalid access code')) return
    const wasLeader = role === 'leader'
    logout().then(() => navigate(wasLeader ? '/' : '/s', { replace: true }))
  }, [error, role, logout, navigate])
}
