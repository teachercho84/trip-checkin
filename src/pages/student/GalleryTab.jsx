import { useEffect, useRef, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import { useGroupBundle } from '../../hooks/useGroupBundle'
import { fetchGalleryPhotos, uploadGalleryPhoto } from '../../lib/gallery'
import CameraCapture from '../../components/common/CameraCapture'
import GalleryGrid from '../../components/common/GalleryGrid'
import './GalleryTab.css'

export default function GalleryTab() {
  const { accessCode, role, groupId } = useSession()
  const { bundle } = useGroupBundle(accessCode)
  const fileInputRef = useRef(null)

  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadPhotos() {
    setLoading(true)
    try {
      setPhotos(await fetchGalleryPhotos())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPhotos()
  }, [])

  function handleCapture(blob) {
    setPendingFile(blob)
    setPreviewUrl(URL.createObjectURL(blob))
    setCameraOpen(false)
  }

  function handlePickFiles(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setPendingFile(files)
    setPreviewUrl(null)
  }

  async function handleSubmit() {
    if (!pendingFile || !name.trim() || !password.trim() || !bundle?.group?.id) return
    setSubmitting(true)
    setFormError('')
    try {
      const files = Array.isArray(pendingFile) ? pendingFile : [pendingFile]
      for (const file of files) {
        await uploadGalleryPhoto({
          accessCode,
          groupId: bundle.group.id,
          name: name.trim(),
          password: password.trim(),
          title: title.trim(),
          photoFile: file,
        })
      }
      setTitle('')
      setPendingFile(null)
      setPreviewUrl(null)
      await loadPhotos()
    } catch (err) {
      setFormError(err.message ?? '업로드에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleDeleted(photoId) {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  function handleLiked(photoId) {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, like_count: p.like_count + 1 } : p)))
  }

  return (
    <div className="gallery-tab">
      <h1>갤러리</h1>

      <div className="gallery-tab__upload">
        {cameraOpen ? (
          <CameraCapture onCapture={handleCapture} onCancel={() => setCameraOpen(false)} />
        ) : (
          <>
            {previewUrl && <img className="gallery-tab__preview" src={previewUrl} alt="선택한 사진" />}
            {Array.isArray(pendingFile) && <p>{pendingFile.length}장 선택됨</p>}
            <div className="gallery-tab__buttons">
              <button type="button" onClick={() => setCameraOpen(true)}>
                사진 찍기
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                사진 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handlePickFiles}
              />
            </div>
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="password"
              placeholder="비밀번호 (삭제할 때 필요)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="top-action-button"
              onClick={handleSubmit}
              disabled={!pendingFile || !name.trim() || !password.trim() || submitting}
            >
              {submitting ? '올리는 중...' : '올리기'}
            </button>
            {formError && <p className="gallery-tab__error">{formError}</p>}
          </>
        )}
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <GalleryGrid
          photos={photos}
          role={role}
          groupId={groupId}
          accessCode={accessCode}
          defaultGroupName={bundle?.group?.name}
          onDeleted={handleDeleted}
          onLiked={handleLiked}
        />
      )}
    </div>
  )
}
