import Swal from 'sweetalert2'

const BASE = {
  confirmButtonColor: '#1F6B4C',
  cancelButtonColor:  '#6b7280',
  reverseButtons:     true,
  focusCancel:        true,
  customClass: {
    popup:          'dent-swal-popup',
    title:          'dent-swal-title',
    confirmButton:  'dent-swal-confirm',
    cancelButton:   'dent-swal-cancel',
  },
}

/** Silme onayı — true dönerse kullanıcı onayladı */
export async function silOnay(mesaj) {
  const { isConfirmed } = await Swal.fire({
    ...BASE,
    title:             'Emin misiniz?',
    text:              mesaj,
    icon:              'warning',
    showCancelButton:  true,
    confirmButtonText: 'Evet, sil',
    cancelButtonText:  'Vazgeç',
  })
  return isConfirmed
}

/** Genel onay kutusu */
export async function onayKutusu({ baslik, mesaj, onayMetni = 'Evet', iptalMetni = 'Vazgeç' }) {
  const { isConfirmed } = await Swal.fire({
    ...BASE,
    title:             baslik,
    text:              mesaj,
    icon:              'question',
    showCancelButton:  true,
    confirmButtonText: onayMetni,
    cancelButtonText:  iptalMetni,
  })
  return isConfirmed
}

/** Hata mesajı */
export async function hataGoster(mesaj) {
  await Swal.fire({
    ...BASE,
    title:             'Bir hata oluştu',
    text:              mesaj,
    icon:              'error',
    showCancelButton:  false,
    confirmButtonText: 'Tamam',
  })
}

/** Bilgi mesajı */
export async function bilgiGoster(mesaj, baslik = 'Uyarı') {
  await Swal.fire({
    ...BASE,
    title:             baslik,
    text:              mesaj,
    icon:              'info',
    showCancelButton:  false,
    confirmButtonText: 'Tamam',
  })
}
