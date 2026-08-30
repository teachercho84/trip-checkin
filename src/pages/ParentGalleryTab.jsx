import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { fetchGalleryPhotos } from '../lib/gallery'
import GalleryGrid from '../components/common/GalleryGrid'

/** 학부모용 갤러리 탭 (읽기 전용, 삭제 버튼 없음). */
export default function ParentGalleryTab() {
  const { bundle } = useOutletContext()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGalleryPhotos().then((data) => {
      setPhotos(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <p>불러오는 중...</p>

  return (
    <GalleryGrid
      photos={photos}
      role="parent"
      defaultGroupName={bundle.group.name}
      onDeleted={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
      onLiked={(id) =>
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, like_count: p.like_count + 1 } : p)))
      }
    />
  )
}
