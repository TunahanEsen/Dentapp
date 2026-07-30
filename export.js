// ─── CSV Export ───────────────────────────────────────────────────────────────
export function csvIndir(satırlar, dosyaAdi) {
  if (!satırlar || satırlar.length === 0) {
    alert('Dışa aktarılacak veri bulunamadı.')
    return
  }

  const basliklar = Object.keys(satırlar[0])
  const bom = '﻿' // Excel Türkçe karakter desteği

  const icerik = [
    basliklar.join(';'),
    ...satırlar.map(satir =>
      basliklar.map(b => {
        const deger = satir[b] ?? ''
        const str = String(deger)
        return str.includes(';') || str.includes('\n') || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(';')
    )
  ].join('\r\n')

  const blob = new Blob([bom + icerik], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `${dosyaAdi}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// ─── İşlem Kaydı Raporu ───────────────────────────────────────────────────────
export function islemRaporuYazdir(kayitlar, tarih, ozet) {
  if (!kayitlar || kayitlar.length === 0) { alert('Yazdırılacak kayıt yok.'); return }

  const para = v => Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

  const satirHtml = kayitlar.map(k => {
    const tutar = k.farkliTutar ? (k.odenenTutar ?? k.sistemFiyati) : k.sistemFiyati
    const saat  = new Date(k.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    const fark  = k.farkliTutar ? `<span style="font-size:10px;color:#94a3b8;text-decoration:line-through;">${para(k.sistemFiyati)}</span>` : ''
    return `<tr>
      <td>${saat}</td>
      <td>${k.doktorAd}</td>
      <td>${k.tedaviAd}<br/><small style="color:#888">${k.tedaviKategori}</small></td>
      <td>${k.odemeYontemi}</td>
      <td style="text-align:right">${para(tutar)} ${fark}</td>
    </tr>`
  }).join('')

  const pencere = window.open('', '_blank', 'width=960,height=720,scrollbars=yes')
  if (!pencere) { alert('Tarayıcı popup engelleyici PDF penceresini açmayı engelledi.'); return }

  const tarihGosterim = new Date(tarih + 'T00:00:00')
    .toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  pencere.document.open()
  pencere.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <title>İşlem Raporu — ${tarih}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',sans-serif;padding:32px;color:#333;margin:0}
    h2{color:#1F6B4C;margin:0 0 4px}
    .meta{color:#888;font-size:12px;margin-bottom:20px}
    .ozet{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
    .ozet-kart{background:#E8F5EE;border-radius:8px;padding:10px 18px;min-width:120px}
    .ozet-etiket{font-size:11px;color:#5A7A6A;margin-bottom:2px}
    .ozet-deger{font-size:20px;font-weight:800;color:#1F6B4C}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{background:#E8F5EE;color:#1F6B4C;font-weight:600;padding:9px 12px;text-align:left;border-bottom:2px solid #B2D9C5}
    td{padding:8px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
    tr:nth-child(even) td{background:#fafafa}
    tfoot td{font-weight:700;background:#f5f6fa;border-top:2px solid #B2D9C5}
    .btn{margin-top:24px;padding:10px 24px;background:#1F6B4C;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px}
    @media print{.btn{display:none!important}body{padding:16px}}
  </style>
</head>
<body>
  <h2>🦷 Günlük İşlem Raporu</h2>
  <p class="meta">Tarih: ${tarihGosterim} &nbsp;·&nbsp; Oluşturulma: ${new Date().toLocaleString('tr-TR')}</p>
  <div class="ozet">
    <div class="ozet-kart"><div class="ozet-etiket">İşlem Sayısı</div><div class="ozet-deger">${ozet.sayi}</div></div>
    <div class="ozet-kart"><div class="ozet-etiket">Toplam Gelir</div><div class="ozet-deger">${para(ozet.toplam)}</div></div>
    <div class="ozet-kart"><div class="ozet-etiket">💵 Nakit</div><div class="ozet-deger">${para(ozet.nakit)}</div></div>
    <div class="ozet-kart"><div class="ozet-etiket">💳 Kart</div><div class="ozet-deger">${para(ozet.kart)}</div></div>
  </div>
  <table>
    <thead><tr><th>Saat</th><th>Doktor</th><th>Tedavi</th><th>Ödeme</th><th style="text-align:right">Tutar</th></tr></thead>
    <tbody>${satirHtml}</tbody>
    <tfoot><tr><td colspan="4">Toplam</td><td style="text-align:right">${para(ozet.toplam)}</td></tr></tfoot>
  </table>
  <button class="btn" onclick="window.print()">🖨️ Yazdır / PDF Kaydet</button>
</body>
</html>`)
  pencere.document.close()
  pencere.focus()
}

// ─── Print / PDF ──────────────────────────────────────────────────────────────
export function yazdir(elementId, baslik) {
  const element = document.getElementById(elementId)
  if (!element) {
    alert(`"${elementId}" id'li element bulunamadı.`)
    return
  }

  const icerik = element.innerHTML

  // Yeni sekme aç — popup engelleyiciler genellikle doğrudan click'ten açılanı geçirir
  const pencere = window.open('', '_blank', 'width=960,height=720,scrollbars=yes')
  if (!pencere) {
    alert('Tarayıcı popup engelleyici PDF penceresini açmayı engelledi.\nLütfen tarayıcı adres çubuğundaki popup izin butonuna tıklayın.')
    return
  }

  pencere.document.open()
  pencere.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${baslik}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; padding: 28px; color: #333; margin: 0; }
    h2   { color: #1F6B4C; margin-bottom: 6px; font-size: 20px; }
    .tarih { color: #888; font-size: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #E8F5EE; color: #1F6B4C; font-weight: 600; padding: 9px 12px; text-align: left; border-bottom: 2px solid #B2D9C5; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    tr:nth-child(even) td { background: #fafafa; }
    .yazdir-btn {
      margin-top: 20px; padding: 10px 24px;
      background: #1F6B4C; color: #fff;
      border: none; border-radius: 6px; cursor: pointer; font-size: 14px;
    }
    @media print {
      .yazdir-btn { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h2>${baslik}</h2>
  <p class="tarih">Oluşturma tarihi: ${new Date().toLocaleString('tr-TR')}</p>
  ${icerik}
  <br/>
  <button class="yazdir-btn" onclick="window.print()">🖨️ Yazdır / PDF Kaydet</button>
</body>
</html>`)
  pencere.document.close()
  pencere.focus()
}
