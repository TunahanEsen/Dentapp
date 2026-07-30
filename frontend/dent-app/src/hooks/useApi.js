import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../utils/apiBase'

// Token'ı otomatik ekleyen fetch sarıcısı.
// Tüm modüllerde tekrar kullanabiliriz.
export function useApi() {
  const { token } = useAuth()

  async function apiFetch(yol, secenekler = {}) {
    const yanit = await fetch(`${API_BASE}${yol}`, {
      ...secenekler,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...secenekler.headers,
      },
    })

    if (!yanit.ok) {
      const hata = await yanit.text()
      throw new Error(hata || `HTTP ${yanit.status}`)
    }

    // 204 No Content gelirse boş döner
    if (yanit.status === 204) return null
    return yanit.json()
  }

  return { apiFetch }
}
