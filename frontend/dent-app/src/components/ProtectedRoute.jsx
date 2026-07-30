import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// children: bu bileşenin içine yazılan JSX içeriği
export default function ProtectedRoute({ children }) {
  const { token } = useAuth()

  // Token yoksa login'e yönlendir, replace: geri tuşuyla korumalı sayfaya dönmeyi engeller
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}
