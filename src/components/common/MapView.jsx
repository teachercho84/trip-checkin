import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'

const CONTAINER_STYLE = { width: '100%', height: '320px', borderRadius: '16px' }
const MAP_OPTIONS = {
  streetViewControl: false,
  zoomControl: false,
  rotateControl: false,
  panControl: false,
  cameraControl: false,
}

/**
 * Renders a group's checked-in points as numbered markers connected by a
 * straight polyline in check-in order, plus upcoming (not yet checked-in)
 * points as separate gray markers, per spec section 5.1/5.2.
 *
 * When `plannedPoints` ([{ lat, lng, done }], in schedule order) is given, the
 * map instead shows the planned route: numbered markers (orange once checked
 * in, gray otherwise) joined by direction arrows in schedule order.
 */
export default function MapView({ donePoints = [], upcomingPoints = [], plannedPoints, center }) {
  const isLoaded = useGoogleMapsLoaded()

  if (!isLoaded) return <div style={CONTAINER_STYLE}>지도를 불러오는 중...</div>

  const mapCenter =
    center ?? plannedPoints?.[0] ?? donePoints[0] ?? upcomingPoints[0] ?? { lat: 37.5665, lng: 126.978 }

  if (plannedPoints) {
    return (
      <GoogleMap mapContainerStyle={CONTAINER_STYLE} center={mapCenter} zoom={13} options={MAP_OPTIONS}>
        {plannedPoints.slice(1).map((p, i) => (
          <Polyline
            key={`seg-${i}`}
            path={[plannedPoints[i], p]}
            options={{
              strokeColor: '#159aa6',
              strokeOpacity: 0.6,
              strokeWeight: 3,
              icons: [
                {
                  icon: {
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                    strokeColor: '#159aa6',
                    fillColor: '#159aa6',
                    fillOpacity: 1,
                  },
                  offset: '50%',
                },
              ],
            }}
          />
        ))}
        {plannedPoints.map((p, i) => (
          <Marker
            key={`planned-${i}`}
            position={{ lat: p.lat, lng: p.lng }}
            label={{ text: String(i + 1), color: '#fff', fontSize: '12px', fontWeight: '600' }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: p.done ? '#ff7a59' : '#9ca3af',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
          />
        ))}
      </GoogleMap>
    )
  }

  return (
    <GoogleMap mapContainerStyle={CONTAINER_STYLE} center={mapCenter} zoom={13} options={MAP_OPTIONS}>
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
