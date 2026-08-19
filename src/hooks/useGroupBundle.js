import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Loads the logged-out student's own group data (schedule, members,
 * check-ins, emergency contacts) via the `get_group_bundle` RPC, keyed on
 * the group's access code. Never exposes other groups' data.
 */
export function useGroupBundle(accessCode) {
  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!accessCode) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('get_group_bundle', {
      p_access_code: accessCode,
    })
    if (rpcError) {
      setError(rpcError)
    } else {
      setBundle(data)
      setError(null)
    }
    setLoading(false)
  }, [accessCode])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { bundle, loading, error, refetch }
}
