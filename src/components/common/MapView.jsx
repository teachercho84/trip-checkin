import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'

const CONTAINER_STYLE = { width: '100%', height: '320px', borderRadius: '10px' }

/**
 * Renders a group's checked-in points as numbered markers connected by a
 * straight polyline in check-in order, plus upcoming (not yet checked-in)
 * points as separate gray markers, per spec section 5.1/5.2.
 */
export default function MapView({ donePoints = [], upcomingPoints = [], center }) {
  const isLoaded = useGoogleMapsLoaded()

  if (!isLoaded) return <div style={CONTAINER_STYLE}>지도를 불러오는 중...</div>

  const mapCenter = center ?? donePoints[0] ?? upcomingPoints[0] ?? { lat: 37.5665, lng: 126.978 }

  return (
    <GoogleMap mapContainerStyle={CONTAINER_STYLE} center={mapCenter} zoom={13}>
      {donePoints.map((p, i) => (
        <Marker key={`done-${i}`} position={p} label={String(i + 1)} />
      ))}
      {upcomingPoints.map((p, i) => (
        <Marker
          key={`upcoming-${i}`}
          position={p}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#9ca3af',
            fillOpacity: 1,
            strokeColor: '#6b7280',
            strokeWeight: 1,
          }}
        />
      ))}
      {donePoints.length > 1 && (
        <Polyline path={donePoints} options={{ strokeColor: '#2563eb', strokeWeight: 3 }} />
      )}
    </GoogleMap>
  )
}
