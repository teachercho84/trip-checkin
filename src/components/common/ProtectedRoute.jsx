import { Navigate } from 'react-router-dom'
import { useSession } from '../../context/SessionContext'

/**
 * Gates a route by role. `allow` is an array of roles permitted to view it,
 * e.g. ['teacher'] or ['student', 'leader'].
 */
export default function ProtectedRoute({ allow, children }) {
  const { role, loading } = useSession()

  if (loading) return null
  if (!role || !allow.includes(role)) return <Navigate to="/" replace />

  return children
}
