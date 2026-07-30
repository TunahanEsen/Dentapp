import { createContext, useContext, useState } from 'react'

// 1. Context nesnesini oluştur (başlangıç değeri null)
const AuthContext = createContext(null)

// 2. Provider: uygulamanın en üstüne sarıyoruz, altındaki her bileşen erişebilir
export function AuthProvider({ children }) {
  // localStorage: tarayıcıyı kapatsan bile token kaybolmaz
  const [token, setToken]       = useState(() => localStorage.getItem('token'))
  const [kullanici, setKullanici] = useState(() => {
    const kayitli = localStorage.getItem('kullanici')
    return kayitli ? JSON.parse(kayitli) : null
  })

  function girisYap(tokenDegeri, kullaniciBilgisi) {
    localStorage.setItem('token', tokenDegeri)
    localStorage.setItem('kullanici', JSON.stringify(kullaniciBilgisi))
    setToken(tokenDegeri)
    setKullanici(kullaniciBilgisi)
  }

  function cikisYap() {
    localStorage.removeItem('token')
    localStorage.removeItem('kullanici')
    setToken(null)
    setKullanici(null)
  }

  return (
    <AuthContext.Provider value={{ token, kullanici, girisYap, cikisYap }}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Kısayol hook — bileşenlerde useAuth() yazarak kullanacağız
export function useAuth() {
  return useContext(AuthContext)
}
