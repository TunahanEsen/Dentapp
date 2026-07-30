import { useState, useEffect, useCallback } from 'react'
import { useApi } from './useApi'

const OKUNDU_KEY = 'dentapp_okundu_bildirimler'

function okunanlariYukle() {
  try { return new Set(JSON.parse(localStorage.getItem(OKUNDU_KEY) || '[]')) }
  catch { return new Set() }
}

export function useNotifications() {
  const { apiFetch }    = useApi()
  const [bildirimler, setBildirimler] = useState([])
  const [okundu,      setOkundu]      = useState(okunanlariYukle)

  const getir = useCallback(async () => {
    try {
      const bugun     = new Date()
      const bugunStr  = bugun.toISOString().split('T')[0]
      const ucGunStr  = new Date(bugun.getTime() + 3 * 86400000).toISOString().split('T')[0]
      const yediGunStr = new Date(bugun.getTime() + 7 * 86400000).toISOString().split('T')[0]

      const [stok, gorevler, vardiyalar] = await Promise.all([
        apiFetch('/api/stok'),
        apiFetch('/api/gorevler'),
        apiFetch(`/api/vardiyalar?baslangic=${bugunStr}&bitis=${yediGunStr}`).catch(() => []),
      ])

      const liste = []

      // ── Düşük / Tükenmiş Stok ───────────────────────────────────────────────
      stok.filter(k => k.miktar <= k.minimumMiktar).forEach(k => {
        const kritik = k.miktar === 0
        liste.push({
          id:     `stok-${k.id}`,
          tip:    'stok',
          ikon:   kritik ? '🔴' : '🟠',
          baslik: kritik ? 'Stok Tükendi' : 'Düşük Stok',
          mesaj:  `${k.urunAdi} — ${k.miktar} ${k.birim} kaldı (min: ${k.minimumMiktar})`,
          yol:    '/dashboard/stok',
          renk:   kritik ? '#c62828' : '#e65100',
          arka:   kritik ? '#FFF0F0' : '#FFF3E0',
        })
      })

      // ── Süresi Geçmiş Görevler ───────────────────────────────────────────────
      gorevler
        .filter(g => g.sonTarih && g.durum !== 'Tamamlandı' && new Date(g.sonTarih) < new Date(bugunStr))
        .forEach(g => {
          const gecenGun = Math.floor((new Date(bugunStr) - new Date(g.sonTarih)) / 86400000)
          liste.push({
            id:     `gorev-gecmis-${g.id}`,
            tip:    'gorev',
            ikon:   '⏰',
            baslik: 'Süre Aşımı',
            mesaj:  `"${g.baslik}" — ${gecenGun} gün önce doldu`,
            yol:    '/dashboard/gorevler',
            renk:   '#c62828',
            arka:   '#FFF0F0',
          })
        })

      // ── Bugün / 3 Gün İçinde Dolacak Görevler ───────────────────────────────
      gorevler
        .filter(g => {
          if (!g.sonTarih || g.durum === 'Tamamlandı') return false
          const fark = Math.floor((new Date(g.sonTarih) - new Date(bugunStr)) / 86400000)
          return fark >= 0 && fark <= 3
        })
        .forEach(g => {
          const fark = Math.floor((new Date(g.sonTarih) - new Date(bugunStr)) / 86400000)
          liste.push({
            id:     `gorev-yaklasan-${g.id}`,
            tip:    'gorev',
            ikon:   fark === 0 ? '🚨' : '📌',
            baslik: fark === 0 ? 'Bugün Son Gün!' : `${fark} Gün Kaldı`,
            mesaj:  `"${g.baslik}"`,
            yol:    '/dashboard/gorevler',
            renk:   fark === 0 ? '#d97706' : '#0288d1',
            arka:   fark === 0 ? '#FEF3C7' : '#E3F2FD',
          })
        })

      // ── Yaklaşan Nöbetler (3 gün içinde) ────────────────────────────────────
      const ucGunSonu = new Date(ucGunStr + 'T23:59:59')
      vardiyalar
        .filter(v => {
          const t = new Date(v.tarih)
          return t >= bugun && t <= ucGunSonu
        })
        .forEach(v => {
          const tarihStr = new Date(v.tarih).toLocaleDateString('tr-TR', {
            weekday: 'short', day: 'numeric', month: 'short',
          })
          liste.push({
            id:     `nobet-${v.id}`,
            tip:    'nobet',
            ikon:   '📅',
            baslik: 'Yaklaşan Nöbet',
            mesaj:  `${v.calisanAd} — ${tarihStr} ${v.tur}`,
            yol:    '/dashboard/nobet',
            renk:   '#1F6B4C',
            arka:   '#E8F5EE',
          })
        })

      setBildirimler(liste)
    } catch {
      // Bildirim hatası uygulamayı durdurmamalı
    }
  }, [apiFetch])

  useEffect(() => {
    getir()
    const timer = setInterval(getir, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [getir])

  function tumunuOkunduIsaretle() {
    const yeni = new Set(bildirimler.map(b => b.id))
    localStorage.setItem(OKUNDU_KEY, JSON.stringify([...yeni]))
    setOkundu(yeni)
  }

  function okunduIsaretle(id) {
    const yeni = new Set([...okundu, id])
    localStorage.setItem(OKUNDU_KEY, JSON.stringify([...yeni]))
    setOkundu(yeni)
  }

  return {
    bildirimler,
    okunmamisSayi: bildirimler.filter(b => !okundu.has(b.id)).length,
    tumunuOkunduIsaretle,
    okunduIsaretle,
  }
}
