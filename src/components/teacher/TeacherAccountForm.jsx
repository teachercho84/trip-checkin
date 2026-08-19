import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function TeacherAccountForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const { data, error } = await supabase.rpc('create_teacher_account', {
        p_name: name,
        p_phone: phone,
      })
      if (error) throw error

      const { error: fnError } = await supabase.functions.invoke('provision-accounts', {
        body: { internalCode: data.internal_code, password: phone },
      })
      if (fnError) throw fnError

      setMessage(`${name} 교사 계정이 생성되었습니다.`)
      setName('')
      setPhone('')
    } catch (err) {
      setMessage(`실패: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="teacher-account-form">
      <h2>교사 계정 추가</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          placeholder="휴대폰번호"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? '생성 중...' : '추가'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}
