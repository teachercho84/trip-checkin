import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { loginWithDisplayName } from '../lib/auth'
import { useSession } from '../context/SessionContext'

export default function LoginPage() {
  const { role: sessionRole, loading: sessionLoading } = useSession()
  const [role, setRole] = useState('teacher') // 'teacher' | 'group_leader'
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  // 이미 세션(접속코드/로그인)이 남아있는 상태로 이 페이지에 오면 로그인 폼 대신
  // 원래 화면으로 바로 돌려보낸다 — 사진 라이브러리를 열었다가 안드로이드가 PWA를
  // 재시작하면서 시작 주소(/)로 떨어지는 경우 등, 로그인 화면이 잘못 뜨는 걸 방지.
  if (sessionLoading) return null
  if (sessionRole === 'teacher') return <Navigate to="/teacher/dashboard" replace />
  if (sessionRole === 'student' || sessionRole === 'leader') return <Navigate to="/student/schedule" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await loginWithDisplayName(displayName, role, password)
      navigate(role === 'teacher' ? '/teacher/dashboard' : '/student/schedule')
    } catch (err) {
      setError(err.message ?? '로그인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <h1>영산고 문화체험여행 체크인</h1>

      <div className="login-page__role-toggle">
        <button
          type="button"
          className={role === 'teacher' ? 'is-active' : ''}
          onClick={() => setRole('teacher')}
        >
          교사
        </button>
        <button
          type="button"
          className={role === 'group_leader' ? 'is-active' : ''}
          onClick={() => setRole('group_leader')}
        >
          모둠장
        </button>
      </div>

      <form onSubmit={handleSubmit} className="login-page__form">
        <label>
          {role === 'teacher' ? '이름' : '모둠명'}
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </label>
        <label>
          비밀번호 ({role === 'teacher' ? '휴대폰번호' : '학번'})
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="login-page__error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  )
}
