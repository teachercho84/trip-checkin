/**
 * Captures the device's current position once (not continuous tracking),
 * per spec: location is captured only at the moment of check-in.
 *
 * 실외에서는 빠른 정밀 GPS(enableHighAccuracy)로 먼저 시도하고, 실내 등
 * 신호가 약해 시간 초과되면 정확도를 낮춰(네트워크/Wi-Fi 기반) 한 번 더
 * 시도한다 — 체크인 목적상 "대략 그 위치 근처"면 충분하고, 실내에서
 * 정밀 GPS만 고집하면 체크인 자체가 계속 실패하기 때문.
 */
export function getCurrentPositionOnce() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'))
      return
    }

    const succeed = (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude })
    const fail = (error) => reject(new Error(geolocationErrorMessage(error)))

    navigator.geolocation.getCurrentPosition(
      succeed,
      (error) => {
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(succeed, fail, {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000,
          })
          return
        }
        fail(error)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  })
}

function geolocationErrorMessage(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return '위치 권한이 거부되어 있어요. 브라우저(또는 설치된 앱) 설정에서 이 사이트의 위치 접근을 허용한 뒤 다시 시도해주세요.'
    case error.POSITION_UNAVAILABLE:
      return '위치를 확인할 수 없어요. 스마트폰의 위치(GPS) 설정이 켜져 있는지 확인하고 다시 시도해주세요.'
    case error.TIMEOUT:
      return '위치 확인이 시간 초과됐어요. 하늘이 트인 곳으로 이동한 뒤 다시 시도해주세요.'
    default:
      return '위치 정보를 가져오지 못했어요. 다시 시도해주세요.'
  }
}
