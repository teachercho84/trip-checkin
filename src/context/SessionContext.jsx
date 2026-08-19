import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const ACCESS_CODE_KEY = 'p10_access_code'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [accessCode, setAccessCodeState] = useState(() => localStorage.getItem(ACCESS_CODE_KEY))
  const [authSession, setAuthSession] = useState(null)
  const [role, setRole] = useState(null) // 'student' | 'leader' | 'teacher'
  const [groupId, setGroupId] = useState(null)
  const [loading, setLoading] = useState(true)

  const setAccessCode = useCallback((code) => {
    localStorage.setItem(ACCESS_CODE_KEY, code)
    setAccessCodeState(code)
    setRole('student')
  }, [])

  const resolveAuthRole = useCallback(async (session) => {
    if (!session) {
      setRole(accessCode ? 'student' : null)
      setGroupId(null)
      return
    }
    const internalCode = session.user.email.split('@')[0]
    const { data } = await supabase
      .from('auth_accounts')
      .select('role, group_id')
      .eq('internal_code', internalCode)
      .maybeSingle()
    if (data) {
      setRole(data.role === 'teacher' ? 'teacher' : 'leader')
      setGroupId(data.group_id)
    }
  }, [accessCode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session)
      resolveAuthRole(session).finally(() => setLoading(false))
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session)
      resolveAuthRole(session)
    })
    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    localStorage.removeItem(ACCESS_CODE_KEY)
    setAccessCodeState(null)
    setRole(null)
    setGroupId(null)
  }, [])

  const value = {
    accessCode,
    setAccessCode,
    authSession,
    role,
    groupId,
    loading,
    logout,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
