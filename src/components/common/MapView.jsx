import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'

const CONTAINER_STYLE = { width: '100%', height: '320px', borderRadius: '16px' }

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
        <Marker
          key={`done-${i}`}
          position={p}
          label={{ text: String(i + 1), color: '#fff', fontSize: '12px', fontWeight: '600' }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ff7a59',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />
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
        <Polyline path={donePoints} options={{ strokeColor: '#159aa6', strokeWeight: 3 }} />
      )}
    </GoogleMap>
  )
}
