import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function GroupMemberAddForm() {
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [members, setMembers] = useState([''])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { status: 'ok', groupName, count } | null
  const [error, setError] = useState('')
  const [currentMembers, setCurrentMembers] = useState([]) // [{ id, name }]
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('id, name').order('name')
    setGroups(data ?? [])
  }

  async function loadMembers(groupId) {
    if (!groupId) {
      setCurrentMembers([])
      return
    }
    const { data, error: loadError } = await supabase
      .from('group_members')
      .select('id, name')
      .eq('group_id', groupId)
      .order('name')
    if (loadError) {
      setError(`모둠원 목록을 불러오지 못했습니다: ${loadError.message}`)
      return
    }
    setCurrentMembers(data ?? [])
  }

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    setEditingId(null)
    loadMembers(selectedGroupId)
  }, [selectedGroupId])

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

  function startEdit(member) {
    setEditingId(member.id)
    setEditName(member.name)
    setError('')
    setResult(null)
  }

  async function saveEdit(member) {
    const newName = editName.trim()
    if (!newName) return
    if (newName === member.name) {
      setEditingId(null)
      return
    }
    setBusyId(member.id)
    setError('')
    const { error: updateError } = await supabase
      .from('group_members')
      .update({ name: newName })
      .eq('id', member.id)
    setBusyId(null)
    if (updateError) {
      setError(`수정 실패: ${updateError.message}`)
      return
    }
    setEditingId(null)
    await loadMembers(selectedGroupId)
  }

  async function deleteMember(member) {
    if (!window.confirm(`"${member.name}" 학생을 "${selectedGroup?.name}" 모둠에서 뺄까요?`)) return
    setBusyId(member.id)
    setError('')
    setResult(null)
    const { error: deleteError } = await supabase.from('group_members').delete().eq('id', member.id)
    setBusyId(null)
    if (deleteError) {
      setError(`삭제 실패: ${deleteError.message}`)
      return
    }
    await loadMembers(selectedGroupId)
  }

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
      await loadMembers(selectedGroupId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="group-member-add-form">
      <h2>모둠원 관리</h2>
      <p>기존 모둠을 선택해 모둠원을 수정·삭제하거나 추가합니다.</p>
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

        {selectedGroupId && (
          <div className="group-member-add-form__members">
            <strong>현재 모둠원 ({currentMembers.length}명)</strong>
            {currentMembers.length === 0 && <span>등록된 모둠원이 없습니다.</span>}
            {currentMembers.map((m) => (
              <div className="group-member-add-form__member-row" key={m.id}>
                {editingId === m.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          saveEdit(m)
                        }
                      }}
                    />
                    <button type="button" onClick={() => saveEdit(m)} disabled={busyId === m.id}>
                      저장
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{m.name}</span>
                    <button type="button" onClick={() => startEdit(m)} disabled={busyId === m.id}>
                      수정
                    </button>
                    <button type="button" onClick={() => deleteMember(m)} disabled={busyId === m.id}>
                      삭제
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="group-member-add-form__members">
          <strong>모둠원 추가</strong>
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
