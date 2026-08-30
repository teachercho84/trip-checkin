import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { deleteGroupCompletely } from '../../lib/groupDelete'

export default function GroupDeleteForm() {
  const [groups, setGroups] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [confirmInput, setConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('id, name').order('name')
    setGroups(data ?? [])
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const selectedGroup = groups.find((g) => g.id === selectedId)

  async function handleDelete() {
    if (!selectedGroup || confirmInput !== selectedGroup.name) return
    if (
      !window.confirm(
        `"${selectedGroup.name}" 모둠을 정말 삭제하시겠습니까? 모둠원, 일정, 체크인 기록, 사진, 모둠장 로그인 계정이 모두 사라지며 되돌릴 수 없습니다.`,
      )
    ) {
      return
    }
    setDeleting(true)
    setError('')
    try {
      await deleteGroupCompletely(selectedGroup.id)
      setSelectedId('')
      setConfirmInput('')
      await loadGroups()
    } catch (err) {
      setError(err.message ?? '삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group-delete-form">
      <h2>모둠 삭제</h2>
      <p>모둠원, 일정, 체크인 기록, 사진, 모둠장 로그인 계정까지 전부 삭제합니다. 되돌릴 수 없습니다.</p>
      <select
        value={selectedId}
        onChange={(e) => {
          setSelectedId(e.target.value)
          setConfirmInput('')
        }}
      >
        <option value="">모둠 선택</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      {selectedGroup && (
        <>
          <p>
            삭제하려면 모둠명 <strong>{selectedGroup.name}</strong>을(를) 아래에 입력하세요.
          </p>
          <div className="group-delete-form__confirm">
            <input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={selectedGroup.name}
            />
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmInput !== selectedGroup.name || deleting}
            >
              {deleting ? '삭제 중...' : '모둠 삭제'}
            </button>
          </div>
        </>
      )}
      {error && <p className="excel-uploader__error">{error}</p>}
    </div>
  )
}
