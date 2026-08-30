import { useState } from 'react'
import AnnouncementEditor from '../../components/teacher/AnnouncementEditor'

export default function AnnouncementsTab() {
  const [parentLinkCopied, setParentLinkCopied] = useState(false)
  const [studentLinkCopied, setStudentLinkCopied] = useState(false)

  async function handleCopyParentLink() {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}#/p`
    await navigator.clipboard.writeText(link)
    setParentLinkCopied(true)
    setTimeout(() => setParentLinkCopied(false), 2000)
  }

  async function handleCopyStudentLink() {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}#/s`
    await navigator.clipboard.writeText(link)
    setStudentLinkCopied(true)
    setTimeout(() => setStudentLinkCopied(false), 2000)
  }

  return (
    <div className="announcements-tab">
      <h1>공지사항</h1>

      <div className="group-detail__parent-link">
        <span className="group-detail__parent-link-label">학부모 공용 링크 (전체 모둠 공용, 1개)</span>
        <div className="group-detail__parent-link-row">
          <input readOnly value={`${window.location.origin}${import.meta.env.BASE_URL}#/p`} onFocus={(e) => e.target.select()} />
          <button type="button" className="top-action-button" onClick={handleCopyParentLink}>
            {parentLinkCopied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      <div className="group-detail__parent-link">
        <span className="group-detail__parent-link-label">학생 공용 링크 (전체 모둠 공용, 1개)</span>
        <div className="group-detail__parent-link-row">
          <input readOnly value={`${window.location.origin}${import.meta.env.BASE_URL}#/s`} onFocus={(e) => e.target.select()} />
          <button type="button" className="top-action-button" onClick={handleCopyStudentLink}>
            {studentLinkCopied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      <AnnouncementEditor />
    </div>
  )
}
