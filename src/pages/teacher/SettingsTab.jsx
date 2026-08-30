import ExcelUploader from '../../components/teacher/ExcelUploader'
import ManualGroupForm from '../../components/teacher/ManualGroupForm'
import GroupDeleteForm from '../../components/teacher/GroupDeleteForm'
import EmergencyContactsEditor from '../../components/teacher/EmergencyContactsEditor'
import TeacherAccountForm from '../../components/teacher/TeacherAccountForm'
import { useSession } from '../../context/SessionContext'

export default function SettingsTab() {
  const { logout } = useSession()

  return (
    <div className="settings-tab">
      <h1>설정</h1>
      <ExcelUploader />
      <hr />
      <ManualGroupForm />
      <hr />
      <GroupDeleteForm />
      <hr />
      <EmergencyContactsEditor />
      <hr />
      <TeacherAccountForm />
      <hr />
      <button type="button" onClick={logout}>
        로그아웃
      </button>
    </div>
  )
}
