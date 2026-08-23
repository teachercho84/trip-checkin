import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const emptyForm = { title: '', body: '' }

export default function AnnouncementEditor() {
  const [announcements, setAnnouncements] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function handleEdit(a) {
    setEditingId(a.id)
    setForm({ title: a.title, body: a.body })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    if (editingId) {
      await supabase.from('announcements').update({ title: form.title, body: form.body }).eq('id', editingId)
    } else {
      await supabase.from('announcements').insert({ title: form.title, body: form.body })
    }
    setSaving(false)
    setForm(emptyForm)
    setEditingId(null)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('이 공지사항을 삭제하시겠습니까?')) return
    await supabase.from('announcements').delete().eq('id', id)
    if (editingId === id) handleCancelEdit()
    load()
  }

  return (
    <div className="announcement-editor">
      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <ul>
          {announcements.map((a) => (
            <li key={a.id}>
              <div className="announcement-editor__item-text">
                <strong>{a.title}</strong>
                <p>{a.body}</p>
              </div>
              <div className="announcement-editor__item-actions">
                <button type="button" onClick={() => handleEdit(a)}>
                  수정
                </button>
                <button type="button" onClick={() => handleDelete(a.id)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="announcement-editor__form">
        <input
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="내용"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          required
        />
        <div className="announcement-editor__form-actions">
          <button type="submit" disabled={saving}>
            {saving ? '저장 중...' : editingId ? '수정 완료' : '등록'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} disabled={saving}>
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
