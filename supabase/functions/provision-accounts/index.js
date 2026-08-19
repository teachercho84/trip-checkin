// Supabase Edge Function: creates the actual Supabase Auth login (email+password)
// for a teacher or group-leader `auth_accounts` row that was already inserted by
// `create_teacher_account` / `replace_group_timetable`. This is the one place in
// the app that needs the service-role key (auth.admin.createUser), so it must run
// server-side rather than in the browser.
//
// Deploy with: supabase functions deploy provision-accounts
// Requires these secrets set on the Supabase project (not in the frontend .env):
//   supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=...

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''

  // Client scoped to the caller's own JWT: used only to verify the caller is a
  // logged-in teacher, via the same RLS-backed is_teacher() function the rest
  // of the app relies on.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: isTeacher, error: roleError } = await callerClient.rpc('is_teacher')
  if (roleError || !isTeacher) {
    return new Response(JSON.stringify({ error: 'teacher 권한이 필요합니다.' }), { status: 403 })
  }

  const { internalCode, password } = await req.json()
  if (!internalCode || !password) {
    return new Response(JSON.stringify({ error: 'internalCode, password가 필요합니다.' }), {
      status: 400,
    })
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { error: createError } = await adminClient.auth.admin.createUser({
    email: `${internalCode}@internal.local`,
    password,
    email_confirm: true,
  })

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
