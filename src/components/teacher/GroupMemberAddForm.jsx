import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function GroupMemberAddForm() {
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [members, setMembers] = useState([''])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { status: 'ok', groupName, count } | null
  const [error, setError] = useState('')

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('id, name').order('name')
    setGroups(data ?? [])
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

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
    setError('')

    const cleanMembers = members.map((m) => m.trim()).filter(Boolean)
    if (!selectedGroupId || cleanMembers.length === 0) return

    setSubmitting(true)
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('group_members')
        .select('name')
        .eq('group_id', selectedGroupId)

      if (fetchError) {
        setError(`확인 중 오류: ${fetchError.message}`)
        return
      }

      const existingNames = new Set((existing ?? []).map((m) => m.name))
      const dupes = cleanMembers.filter((name) => existingNames.has(name))

      if (dupes.length > 0) {
        const proceed = window.confirm(
          `이미 모둠원으로 등록된 이름입니다: ${dupes.join(', ')}. 그래도 추가하시겠습니까?`,
        )
        if (!proceed) return
      }

      const { error: insertError } = await supabase
        .from('group_members')
        .insert(cleanMembers.map((name) => ({ group_id: selectedGroupId, name })))

      if (insertError) {
        setError(`추가 실패: ${insertError.message}`)
        return
      }

      setResult({ status: 'ok', groupName: selectedGroup?.name, count: cleanMembers.length })
      setMembers([''])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="group-member-add-form">
      <h2>모둠원 추가</h2>
      <p>기존 모둠을 선택해 모둠원을 추가합니다. 기존 모둠원은 그대로 유지됩니다.</p>
      <form onSubmit={handleSubmit}>
        <select
          value={selectedGroupId}
          onChange={(e) => {
            setSelectedGroupId(e.target.value)
            setResult(null)
            setError('')
          }}
          required
        >
          <option value="">모둠 선택</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <div className="group-member-add-form__members">
          {members.map((m, i) => (
            <div className="group-member-add-form__member-row" key={i}>
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

        <button type="submit" disabled={submitting || !selectedGroupId}>
          {submitting ? '추가 중...' : '추가하기'}
        </button>
      </form>

      {result && (
        <p className="manual-group-form__result--ok">
          {`"${result.groupName}" 모둠에 ${result.count}명을 추가했습니다.`}
        </p>
      )}
      {error && <p className="excel-uploader__error">{error}</p>}
    </div>
  )
}
