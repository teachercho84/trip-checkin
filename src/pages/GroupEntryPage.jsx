import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

/** Entry point for students: `/g/:accessCode` stores the code and lands on the schedule tab. No login required. */
export default function GroupEntryPage() {
  const { accessCode } = useParams()
  const { setAccessCode } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (accessCode) {
      setAccessCode(accessCode)
      navigate('/student/schedule', { replace: true })
    }
  }, [accessCode, setAccessCode, navigate])

  return null
}
