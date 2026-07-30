import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import ProtectedRoute   from './components/ProtectedRoute'
import AdminRoute       from './components/AdminRoute'

import HomePage          from './pages/public/HomePage'
import MakalePage        from './pages/public/MakalePage'
import LoginPage         from './pages/LoginPage'
import DashboardPage     from './pages/admin/DashboardPage'
import GenelBakisPage    from './pages/admin/GenelBakisPage'
import StokPage          from './pages/admin/StokPage'
import FiyatPage         from './pages/admin/FiyatPage'
import NobetPage         from './pages/admin/NobetPage'
import FinansPage        from './pages/admin/FinansPage'
import KullanicilarPage  from './pages/admin/KullanicilarPage'
import RandevularPage    from './pages/admin/RandevularPage'
import GorevlerPage       from './pages/admin/GorevlerPage'
import IslemKayitlariPage  from './pages/admin/IslemKayitlariPage'
import SifreDegistirPage   from './pages/admin/SifreDegistirPage'
import ProfilPage           from './pages/admin/ProfilPage'
import SiteAyarlariPage     from './pages/admin/SiteAyarlariPage'
import RaporlarPage         from './pages/admin/RaporlarPage'
import LabTakibiPage        from './pages/admin/LabTakibiPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"            element={<HomePage />} />
        <Route path="/makale/:id"  element={<MakalePage />} />
        <Route path="/login"       element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        >
          <Route index                element={<GenelBakisPage />} />
          <Route path="stok"          element={<StokPage />} />
          <Route path="fiyat"         element={<FiyatPage />} />
          <Route path="nobet"         element={<NobetPage />} />
          <Route path="finans"        element={<FinansPage />} />
          <Route path="randevular"    element={<RandevularPage />} />
          <Route path="gorevler"      element={<GorevlerPage />} />
          <Route path="raporlar"      element={<RaporlarPage />} />
          <Route path="lab-takibi"    element={<LabTakibiPage />} />
          <Route path="islemler"      element={<IslemKayitlariPage />} />
          <Route path="kullanicilar"    element={<AdminRoute><KullanicilarPage /></AdminRoute>} />
          <Route path="sifre-degistir" element={<SifreDegistirPage />} />
          <Route path="profil"         element={<ProfilPage />} />
          <Route path="site-ayarlari"  element={<AdminRoute><SiteAyarlariPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
