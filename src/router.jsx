import { HashRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import GroupEntryPage from './pages/GroupEntryPage'
import StudentLayout from './components/common/StudentLayout'
import TeacherLayout from './components/common/TeacherLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import ScheduleTab from './pages/student/ScheduleTab'
import RouteTab from './pages/student/RouteTab'
import ContactsTab from './pages/student/ContactsTab'
import DashboardTab from './pages/teacher/DashboardTab'
import GroupDetailPage from './pages/teacher/GroupDetailPage'
import ItineraryTab from './pages/teacher/ItineraryTab'
import SettingsTab from './pages/teacher/SettingsTab'

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/g/:accessCode" element={<GroupEntryPage />} />

        <Route
          element={
            <ProtectedRoute allow={['student', 'leader']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/student/schedule" element={<ScheduleTab />} />
          <Route path="/student/route" element={<RouteTab />} />
          <Route path="/student/contacts" element={<ContactsTab />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allow={['teacher']}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/teacher/dashboard" element={<DashboardTab />} />
          <Route path="/teacher/dashboard/:groupId" element={<GroupDetailPage />} />
          <Route path="/teacher/itinerary" element={<ItineraryTab />} />
          <Route path="/teacher/settings" element={<SettingsTab />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
