import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { uploadGroups } from '../../lib/excel'

const STATUS_LABEL = {
  ok: '모둠 생성 완료',
  error: '실패',
  account_error: '계정 생성 실패',
}

const emptyLeader = { name: '', leaderName: '', leaderStudentId: '', leaderPhone: '' }

export default function ManualGroupForm() {
  const [form, setForm] = useState(emptyLeader)
  const [members, setMembers] = useState([''])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { status, message? } | null

  function updateMember(index, value) {
    setMembers((prev) => prev.map((m, i) => (i === index ? value : m)))
  }

  function addMember() {
    setMembers((prev) => [...prev, ''])
  }

  function removeMember(index) {
    setMembers((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setResult(null)

    const trimmedName = form.name.trim()
    const cleanMembers = members.map((m) => m.trim()).filter(Boolean)

    setSubmitting(true)
    try {
      const { data: existing, error: checkError } = await supabase
        .from('groups')
        .select('id')
        .eq('name', trimmedName)
        .maybeSingle()

      if (checkError) {
        setResult({ status: 'error', message: `확인 중 오류: ${checkError.message}` })
        return
      }
      if (existing) {
        setResult({ status: 'error', message: `이미 존재하는 모둠명입니다: "${trimmedName}"` })
        return
      }

      const [uploadResult] = await uploadGroups(
        [
          {
            name: trimmedName,
            leaderName: form.leaderName.trim(),
            leaderStudentId: form.leaderStudentId.trim(),
            leaderPhone: form.leaderPhone.trim(),
            members: cleanMembers,
          },
        ],
        {},
        {},
      )

      setResult(uploadResult)
      if (uploadResult.status === 'ok') {
        setForm(emptyLeader)
        setMembers([''])
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="manual-group-form">
      <h2>새 모둠 추가</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="모둠명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="모둠장 이름"
          value={form.leaderName}
          onChange={(e) => setForm({ ...form, leaderName: e.target.value })}
          required
        />
        <input
          placeholder="모둠장 학번"
          value={form.leaderStudentId}
          onChange={(e) => setForm({ ...form, leaderStudentId: e.target.value })}
          required
        />
        <input
          placeholder="모둠장 연락처"
          value={form.leaderPhone}
          onChange={(e) => setForm({ ...form, leaderPhone: e.target.value })}
          required
        />

        <div className="manual-group-form__members">
          {members.map((m, i) => (
            <div className="manual-group-form__member-row" key={i}>
              <input
                placeholder={`모둠원 ${i + 1}`}
                value={m}
                onChange={(e) => updateMember(i, e.target.value)}
              />
              <button type="button" onClick={() => removeMember(i)} disabled={members.length === 1}>
                삭제
              </button>
            </div>
          ))}
          <button type="button" onClick={addMember}>
            모둠원 추가
          </button>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? '생성 중...' : '모둠 생성'}
        </button>
      </form>

      {result && (
        <p className={result.status === 'ok' ? 'manual-group-form__result--ok' : 'excel-uploader__error'}>
          {result.status === 'ok'
            ? `'${result.name}' 모둠이 생성되었습니다.`
            : `${STATUS_LABEL[result.status] ?? result.status}${result.message ? ` — ${result.message}` : ''}`}
        </p>
      )}
    </div>
  )
}
