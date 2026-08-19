import { SessionProvider } from './context/SessionContext'
import { GoogleMapsProvider } from './context/GoogleMapsContext'
import AppRouter from './router'

export default function App() {
  return (
    <SessionProvider>
      <GoogleMapsProvider>
        <AppRouter />
      </GoogleMapsProvider>
    </SessionProvider>
  )
}
