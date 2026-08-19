import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const CATEGORY_LABEL = { homeroom_teacher: '담임교사', bus_driver: '버스기사' }

const emptyForm = { category: 'homeroom_teacher', label: '', name: '', phone: '' }

export default function EmergencyContactsEditor() {
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('category')
      .order('sort_order')
    setContacts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    await supabase.from('emergency_contacts').insert({
      category: form.category,
      label: form.label,
      name: form.name,
      phone: form.phone,
      sort_order: contacts.length,
    })
    setForm(emptyForm)
    load()
  }

  async function handleDelete(id) {
    await supabase.from('emergency_contacts').delete().eq('id', id)
    load()
  }

  return (
    <div className="emergency-contacts-editor">
      <h2>비상연락망</h2>
      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <ul>
          {contacts.map((c) => (
            <li key={c.id}>
              <span>
                [{CATEGORY_LABEL[c.category]}] {c.label} — {c.name} {c.phone}
              </span>
              <button type="button" onClick={() => handleDelete(c.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="emergency-contacts-editor__form">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="homeroom_teacher">담임교사</option>
          <option value="bus_driver">버스기사</option>
        </select>
        <input
          placeholder="구분(예: 1반 담임)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          required
        />
        <input
          placeholder="이름"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="전화번호"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <button type="submit">추가</button>
      </form>
    </div>
  )
}
