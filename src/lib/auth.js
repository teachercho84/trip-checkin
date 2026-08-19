import { supabase } from './supabaseClient'

/**
 * Logs in a teacher or group leader using the Korean display name shown on
 * screen (교사 이름 / 모둠명) plus the password (휴대폰번호 / 학번).
 * Internally resolves the display name to an internal `code@internal.local`
 * email via the `resolve_login_email` RPC, then signs in through Supabase Auth.
 */
export async function loginWithDisplayName(displayName, role, password) {
  const { data: email, error: resolveError } = await supabase.rpc('resolve_login_email', {
    p_display_name: displayName,
    p_role: role,
  })
  if (resolveError) throw resolveError
  if (!email) throw new Error('일치하는 계정을 찾을 수 없습니다.')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('비밀번호가 올바르지 않습니다.')
  return data
}
