import { useSession } from '../../context/SessionContext'
import { useGroupBundle } from '../../hooks/useGroupBundle'
import PhoneLink from '../../components/common/PhoneLink'

const CATEGORY_LABEL = {
  homeroom_teacher: '담임교사',
  bus_driver: '버스기사',
}

export default function ContactsTab() {
  const { accessCode } = useSession()
  const { bundle, loading, error } = useGroupBundle(accessCode)

  if (!accessCode) return <p>접속 코드가 없습니다. 모둠 링크로 다시 접속해주세요.</p>
  if (loading) return <p>불러오는 중...</p>
  if (error) return <p>연락처를 불러오지 못했습니다.</p>

  return (
    <div className="contacts-tab">
      <h1>비상 연락처</h1>
      <ul className="contacts-tab__list">
        {(bundle.emergency_contacts ?? []).map((c, i) => (
          <li key={i}>
            <div className="contacts-tab__label">
              {CATEGORY_LABEL[c.category]} · {c.label}
            </div>
            <PhoneLink name={c.name} phone={c.phone} />
          </li>
        ))}
      </ul>
    </div>
  )
}
