import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { kullanici } = useAuth()

  if (kullanici?.role !== 'Admin') {
    return (
      <div style={s.sayfa}>
        <div style={s.kutu}>
          <span style={s.ikon}>🔒</span>
          <h2 style={s.baslik}>Erişim Engellendi</h2>
          <p style={s.aciklama}>Bu sayfaya sadece <strong>Admin</strong> rolündeki kullanıcılar erişebilir.</p>
        </div>
      </div>
    )
  }

  return children
}

const s = {
  sayfa:    { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  kutu:     { textAlign: 'center', padding: 40 },
  ikon:     { fontSize: 48 },
  baslik:   { margin: '16px 0 8px', color: '#1F6B4C' },
  aciklama: { color: '#888', margin: 0 },
}
