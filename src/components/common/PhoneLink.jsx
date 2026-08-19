export default function PhoneLink({ name, phone }) {
  return (
    <a className="phone-link" href={`tel:${phone}`}>
      {name} · {phone}
    </a>
  )
}
