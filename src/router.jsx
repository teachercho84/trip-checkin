import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import GroupEntryPage from './pages/GroupEntryPage'
import StudentGroupListPage from './pages/StudentGroupListPage'
import ParentScheduleTab from './pages/ParentScheduleTab'
import ParentGalleryTab from './pages/ParentGalleryTab'
import ParentGroupListPage from './pages/ParentGroupListPage'
import StudentLayout from './components/common/StudentLayout'
import TeacherLayout from './components/common/TeacherLayout'
import ParentLayout from './components/common/ParentLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import ScheduleTab from './pages/student/ScheduleTab'
import RouteTab from './pages/student/RouteTab'
import ContactsTab from './pages/student/ContactsTab'
import StudentAnnouncementsTab from './pages/student/AnnouncementsTab'
import StudentGalleryTab from './pages/student/GalleryTab'
import DashboardTab from './pages/teacher/DashboardTab'
import GroupDetailPage from './pages/teacher/GroupDetailPage'
import ItineraryTab from './pages/teacher/ItineraryTab'
import TeacherAnnouncementsTab from './pages/teacher/AnnouncementsTab'
import TeacherGalleryTab from './pages/teacher/GalleryTab'
import SettingsTab from './pages/teacher/SettingsTab'

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/g/:accessCode" element={<GroupEntryPage />} />
        <Route path="/s" element={<StudentGroupListPage />} />
        <Route path="/p" element={<ParentGroupListPage />} />
        <Route path="/p/:accessCode" element={<ParentLayout />}>
          <Route index element={<Navigate to="schedule" replace />} />
          <Route path="schedule" element={<ParentScheduleTab />} />
          <Route path="gallery" element={<ParentGalleryTab />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allow={['student', 'leader']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/student/announcements" element={<StudentAnnouncementsTab />} />
          <Route path="/student/schedule" element={<ScheduleTab />} />
          <Route path="/student/route" element={<RouteTab />} />
          <Route path="/student/contacts" element={<ContactsTab />} />
          <Route path="/student/gallery" element={<StudentGalleryTab />} />
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
          <Route path="/teacher/announcements" element={<TeacherAnnouncementsTab />} />
          <Route path="/teacher/gallery" element={<TeacherGalleryTab />} />
          <Route path="/teacher/settings" element={<SettingsTab />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
