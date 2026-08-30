import { useMemo, useState } from 'react'
import {
  getGalleryPhotoUrl,
  deleteGalleryPhotoDirect,
  deleteGalleryPhotoWithPassword,
  likeGalleryPhoto,
} from '../../lib/gallery'
import './GalleryGrid.css'

const LIKED_KEY = 'gallery_liked_photos'

function getLikedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY)) ?? [])
  } catch {
    return new Set()
  }
}

function rememberLiked(photoId) {
  const ids = getLikedIds()
  ids.add(photoId)
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]))
}

/**
 * 전체 모둠 통합 사진 그리드 + "전체/모둠별" 전환. 학생/모둠장/교사/학부모 공용.
 * role/groupId/accessCode에 따라 삭제 버튼 동작이 갈린다:
 *  - teacher: 전체 즉시 삭제 가능
 *  - leader: 자기 모둠(groupId) 사진만 즉시 삭제 가능
 *  - student: 어느 사진이든 시도 가능하지만 업로드 시 비밀번호를 알아야 삭제됨
 * 추천(좋아요)은 role과 무관하게 누구나 가능 — 같은 브라우저에서 중복 추천만 localStorage로 막는다.
 */
export default function GalleryGrid({ photos, role, groupId, accessCode, defaultGroupName, onDeleted, onLiked }) {
  const [mode, setMode] = useState('all')
  const [selectedGroup, setSelectedGroup] = useState(defaultGroupName ?? '')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [likedIds, setLikedIds] = useState(getLikedIds)

  const groupNames = useMemo(
    () => [...new Set(photos.map((p) => p.group_name))].sort(),
    [photos],
  )

  const visiblePhotos = useMemo(() => {
    if (mode !== 'byGroup' || !selectedGroup) return photos
    return photos.filter((p) => p.group_name === selectedGroup)
  }, [photos, mode, selectedGroup])

  // 추천 TOP 3만 순위로 뽑아 보여주고, 나머지는 최신순(visiblePhotos가 이미 최신순이라 그대로 둠) 그대로 노출.
  const { topPhotos, restPhotos } = useMemo(() => {
    const ranked = [...visiblePhotos].sort(
      (a, b) => b.like_count - a.like_count || new Date(b.created_at) - new Date(a.created_at),
    )
    const topPhotos = ranked.slice(0, 3)
    const topIds = new Set(topPhotos.map((p) => p.id))
    const restPhotos = visiblePhotos.filter((p) => !topIds.has(p.id))
    return { topPhotos, restPhotos }
  }, [visiblePhotos])

  const canDelete = role === 'teacher' || role === 'leader' || role === 'student'

  function canDeleteDirectly(photo) {
    if (role === 'teacher') return true
    if (role === 'leader') return photo.group_id === groupId
    return false
  }

  async function handleDelete(photo) {
    setError('')
    if (canDeleteDirectly(photo)) {
      if (!window.confirm('이 사진을 삭제하시겠습니까?')) return
      setBusyId(photo.id)
      try {
        await deleteGalleryPhotoDirect({ photoId: photo.id, photoPath: photo.photo_path })
        onDeleted?.(photo.id)
      } catch (err) {
        setError(err.message ?? '삭제에 실패했습니다.')
      } finally {
        setBusyId(null)
      }
      return
    }

    const password = window.prompt('삭제하려면 업로드할 때 입력한 비밀번호를 입력하세요.')
    if (!password) return
    setBusyId(photo.id)
    try {
      await deleteGalleryPhotoWithPassword({
        accessCode,
        photoId: photo.id,
        photoPath: photo.photo_path,
        password,
      })
      onDeleted?.(photo.id)
    } catch {
      setError('비밀번호가 일치하지 않습니다.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleLike(photo) {
    if (likedIds.has(photo.id)) return
    try {
      await likeGalleryPhoto(photo.id)
      rememberLiked(photo.id)
      setLikedIds(getLikedIds())
      onLiked?.(photo.id)
    } catch {
      setError('추천에 실패했습니다.')
    }
  }

  function renderCard(photo, rank) {
    return (
      <li key={photo.id} className="gallery-grid__item">
        {rank && <div className="gallery-grid__rank">{rank}위</div>}
        <a href={getGalleryPhotoUrl(photo.photo_path)} target="_blank" rel="noreferrer">
          <img
            className="gallery-grid__thumb"
            src={getGalleryPhotoUrl(photo.photo_path)}
            alt={`${photo.group_name} · ${photo.uploader_name}`}
            loading="lazy"
          />
        </a>
        {canDelete && (
          <button
            type="button"
            className="gallery-grid__delete"
            onClick={() => handleDelete(photo)}
            disabled={busyId === photo.id}
            aria-label="사진 삭제"
          >
            ×
          </button>
        )}
        <div className="gallery-grid__caption">
          {photo.title && <div className="gallery-grid__title">{photo.title}</div>}
          <div className="gallery-grid__meta">
            {photo.group_name} · {photo.uploader_name}
          </div>
          <button
            type="button"
            className={'gallery-grid__like' + (likedIds.has(photo.id) ? ' is-liked' : '')}
            onClick={() => handleLike(photo)}
            disabled={likedIds.has(photo.id)}
          >
            ♥ 추천 {photo.like_count ?? 0}
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="gallery-grid">
      <div className="gallery-grid__mode-tabs">
        <button
          type="button"
          className={mode === 'all' ? 'is-active' : ''}
          onClick={() => setMode('all')}
        >
          전체
        </button>
        <button
          type="button"
          className={mode === 'byGroup' ? 'is-active' : ''}
          onClick={() => setMode('byGroup')}
        >
          모둠별
        </button>
      </div>

      {mode === 'byGroup' && (
        <select
          className="gallery-grid__group-select"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">모둠 선택</option>
          {groupNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      )}

      {error && <p className="gallery-grid__error">{error}</p>}

      {visiblePhotos.length === 0 && <p className="gallery-grid__empty">사진이 없습니다.</p>}

      {topPhotos.length > 0 && (
        <>
          <h2 className="gallery-grid__section-title">🏆 추천 TOP {topPhotos.length}</h2>
          <ul className="gallery-grid__list">{topPhotos.map((photo, i) => renderCard(photo, i + 1))}</ul>
        </>
      )}

      {restPhotos.length > 0 && (
        <>
          <h2 className="gallery-grid__section-title">전체 사진</h2>
          <ul className="gallery-grid__list">{restPhotos.map((photo) => renderCard(photo))}</ul>
        </>
      )}
    </div>
  )
}
