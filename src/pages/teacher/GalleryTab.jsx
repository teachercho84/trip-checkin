import { useEffect, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import { fetchGalleryPhotos } from '../../lib/gallery'
import GalleryGrid from '../../components/common/GalleryGrid'

export default function GalleryTab() {
  const { role } = useSession()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

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

  function handleDeleted(photoId) {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  function handleLiked(photoId) {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, like_count: p.like_count + 1 } : p)))
  }

  return (
    <div className="gallery-tab">
      <h1>갤러리</h1>
      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <GalleryGrid photos={photos} role={role} onDeleted={handleDeleted} onLiked={handleLiked} />
      )}
    </div>
  )
}
