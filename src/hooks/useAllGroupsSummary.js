import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Loads a public summary of every group (id, name, leader_name, access_code)
 * via the `get_all_groups_summary` RPC, for the parent group-picker page.
 */
export function useAllGroupsSummary() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('get_all_groups_summary')
    if (rpcError) {
      setError(rpcError)
    } else {
      setGroups(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { groups, loading, error, refetch }
}
