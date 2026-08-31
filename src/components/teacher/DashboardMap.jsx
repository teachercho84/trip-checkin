import { useEffect, useMemo, useState } from 'react'
import { GoogleMap } from '@react-google-maps/api'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'
import { getCurrentPositionOnce } from '../../lib/geolocation'
import './DashboardMap.css'

const CONTAINER_STYLE = { width: '100%', height: '280px', borderRadius: '16px' }
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const MAP_OPTIONS = { streetViewControl: false, zoomControl: false }
const LOCATE_ICON_SVG = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="7"></circle>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"></circle>
    <line x1="12" y1="2" x2="12" y2="5"></line>
    <line x1="12" y1="19" x2="12" y2="22"></line>
    <line x1="2" y1="12" x2="5" y2="12"></line>
    <line x1="19" y1="12" x2="22" y2="12"></line>
  </svg>
`

/** All-groups dashboard map: one marker per group at its latest position, clustered per spec 5.2. */
export default function DashboardMap({ points }) {
  const isLoaded = useGoogleMapsLoaded()
  const [map, setMap] = useState(null)
  const [myLocation, setMyLocation] = useState(null)

  // Memoized so its object identity only changes when the actual coordinates do —
  // @react-google-maps/api re-applies `center` via map.setCenter() whenever the
  // prop's reference changes, which would otherwise snap the map back on every
  // re-render (e.g. right after panTo() from the locate button, via setMyLocation).
  const firstLat = points[0]?.lat
  const firstLng = points[0]?.lng
  const center = useMemo(
    () => (firstLat != null && firstLng != null ? { lat: firstLat, lng: firstLng } : DEFAULT_CENTER),
    [firstLat, firstLng],
  )

  useEffect(() => {
    // `map` becomes non-null only once GoogleMap's onLoad fires (via state, not a
    // ref) — that's what makes this effect reliably rerun once the map instance
    // actually exists, instead of possibly running once too early and never again.
    if (!map) return

    const markers = points.map(
      (p) =>
        new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          title: p.label,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ff7a59',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        }),
    )
    const clusterer = new MarkerClusterer({
      map,
      markers,
      renderer: {
        render: ({ count, position }) =>
          new window.google.maps.Marker({
            position,
            label: { text: String(count), color: '#fff', fontSize: '12px', fontWeight: '600' },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 16,
              fillColor: '#ff7a59',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          }),
      },
    })

    return () => {
      clusterer.clearMarkers()
    }
  }, [map, points])

  useEffect(() => {
    if (!map) return

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'dashboard-map__locate-btn'
    button.setAttribute('aria-label', '내 위치로 이동')
    button.innerHTML = LOCATE_ICON_SVG

    let locating = false
    async function handleClick() {
      if (locating) return
      locating = true
      button.classList.add('is-locating')
      try {
        const coords = await getCurrentPositionOnce()
        map.panTo(coords)
        map.setZoom(16)
        setMyLocation(coords)
      } catch {
        alert('현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.')
      } finally {
        locating = false
        button.classList.remove('is-locating')
      }
    }
    button.addEventListener('click', handleClick)

    const controls = map.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM]
    controls.push(button)

    return () => {
      button.removeEventListener('click', handleClick)
      for (let i = 0; i < controls.getLength(); i++) {
        if (controls.getAt(i) === button) {
          controls.removeAt(i)
          break
        }
      }
    }
  }, [map])

  useEffect(() => {
    if (!map || !myLocation) return

    const marker = new window.google.maps.Marker({
      position: myLocation,
      map,
      title: '내 위치',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#4285f4',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      zIndex: 999,
    })

    return () => marker.setMap(null)
  }, [map, myLocation])

  if (!isLoaded) return <div style={CONTAINER_STYLE}>지도를 불러오는 중...</div>

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER_STYLE}
      center={center}
      zoom={12}
      options={MAP_OPTIONS}
      onLoad={setMap}
    />
  )
}
