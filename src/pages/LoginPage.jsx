import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithDisplayName } from '../lib/auth'

export default function LoginPage() {
  const [role, setRole] = useState('teacher') // 'teacher' | 'group_leader'
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

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
