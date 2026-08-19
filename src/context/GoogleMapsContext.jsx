import { createContext, useContext } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'

const LIBRARIES = ['places']

const GoogleMapsContext = createContext(false)

export function GoogleMapsProvider({ children }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  return <GoogleMapsContext.Provider value={isLoaded}>{children}</GoogleMapsContext.Provider>
}

export function useGoogleMapsLoaded() {
  return useContext(GoogleMapsContext)
}
