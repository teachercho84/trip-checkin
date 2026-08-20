import { useEffect, useRef, useState } from 'react'
import './CameraCapture.css'

/**
 * In-page camera capture (getUserMedia + canvas snapshot) instead of handing off
 * to the device's native camera app. On Android — Samsung Internet especially —
 * opening the native camera app can cause the browser to discard the page in the
 * background to free memory; returning from the camera then reloads the page from
 * scratch and the just-taken photo is lost before it ever reaches React state.
 * Capturing inside the page avoids leaving the browser entirely, so the tab is
 * never backgrounded.
 */
export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('이 브라우저는 카메라 촬영을 지원하지 않습니다.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setError('')
      } catch {
        if (!cancelled) setError('카메라를 사용할 수 없습니다. 카메라 권한을 확인해주세요.')
      }
    }

    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [facingMode])

  function handleSwitchCamera() {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  function handleShutterClick() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob)
      },
      'image/jpeg',
      0.9,
    )
  }

  return (
    <div className="camera-capture">
      {error ? (
        <p className="camera-capture__error">{error}</p>
      ) : (
        <video ref={videoRef} className="camera-capture__video" autoPlay playsInline muted />
      )}
      <div className="camera-capture__actions">
        {!error && (
          <>
            <button type="button" onClick={handleShutterClick}>
              촬영
            </button>
            <button type="button" onClick={handleSwitchCamera}>
              카메라 전환
            </button>
          </>
        )}
        <button type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  )
}
