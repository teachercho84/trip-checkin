import { useEffect, useState } from 'react'
import { GoogleMap } from '@react-google-maps/api'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'

const CONTAINER_STYLE = { width: '100%', height: '280px', borderRadius: '16px' }
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

/** All-groups dashboard map: one marker per group at its latest position, clustered per spec 5.2. */
export default function DashboardMap({ points }) {
  const isLoaded = useGoogleMapsLoaded()
  const [map, setMap] = useState(null)

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

  if (!isLoaded) return <div style={CONTAINER_STYLE}>지도를 불러오는 중...</div>

  const center = points[0] ? { lat: points[0].lat, lng: points[0].lng } : DEFAULT_CENTER

  return <GoogleMap mapContainerStyle={CONTAINER_STYLE} center={center} zoom={12} onLoad={setMap} />
}
