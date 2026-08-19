/**
 * Captures the device's current position once (not continuous tracking),
 * per spec: location is captured only at the moment of check-in.
 */
export function getCurrentPositionOnce(options = { enableHighAccuracy: true, timeout: 10000 }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(error),
      options,
    )
  })
}
