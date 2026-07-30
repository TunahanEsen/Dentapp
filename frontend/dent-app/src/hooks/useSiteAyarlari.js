import { useState, useEffect } from 'react'
import { API_BASE } from '../utils/apiBase'

let onbellek = null // modül seviyesinde tek seferlik cache

export function useSiteAyarlari() {
  const [ayarlar, setAyarlar] = useState(onbellek)
  const [yukleniyor, setYukleniyor] = useState(!onbellek)

  useEffect(() => {
    if (onbellek) return
    fetch(`${API_BASE}/api/site-ayarlari`)
      .then(r => r.json())
      .then(data => {
        onbellek = data
        setAyarlar(data)
      })
      .catch(() => {}) // hata olursa null kalır, bileşen hardcoded fallback kullanır
      .finally(() => setYukleniyor(false))
  }, [])

  return { ayarlar, yukleniyor }
}
