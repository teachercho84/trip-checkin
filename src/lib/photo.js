const MAX_WIDTH = 1280
const JPEG_QUALITY = 0.7

/**
 * Resizes (max width 1280px) and JPEG-compresses (~70% quality) a photo
 * File before upload, targeting ~150-300KB per spec section 4.3.
 */
export function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width)
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl)
          if (!blob) {
            reject(new Error('사진 압축에 실패했습니다.'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('사진을 불러올 수 없습니다.'))
    }
    img.src = objectUrl
  })
}
