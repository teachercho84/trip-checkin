import { useEffect, useRef } from 'react'
import { GoogleMap } from '@react-google-maps/api'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'

const CONTAINER_STYLE = { width: '100%', height: '280px', borderRadius: '10px' }
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

/** All-groups dashboard map: one marker per group at its latest position, clustered per spec 5.2. */
export default function DashboardMap({ points }) {
  const isLoaded = useGoogleMapsLoaded()
  const mapRef = useRef(null)
  const clustererRef = useRef(null)

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
    }

    const markers = points.map(
      (p) =>
        new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          title: p.label,
        }),
    )

    clustererRef.current = new MarkerClusterer({ map: mapRef.current, markers })

    return () => {
      clustererRef.current?.clearMarkers()
    }
  }, [isLoaded, points])

  if (!isLoaded) return <div style={CONTAINER_STYLE}>지도를 불러오는 중...</div>

  const center = points[0] ? { lat: points[0].lat, lng: points[0].lng } : DEFAULT_CENTER

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER_STYLE}
      center={center}
      zoom={12}
      onLoad={(map) => {
        mapRef.current = map
      }}
    />
  )
}
