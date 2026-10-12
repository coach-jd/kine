import { createRoot } from 'react-dom/client'
import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import './index.css'
import Cierre from './screens/Cierre'
import Ficha from './screens/Ficha'
import Inicio from './screens/Inicio'
import MiKine from './screens/MiKine'
import Proximamente from './screens/Proximamente'
import Reproductor from './screens/Reproductor'

// El tablero privado se descarga solo cuando alguien lo abre.
const Tablero = lazy(() => import('./screens/Tablero'))

// En pantallas anchas la app se ve como una columna de teléfono centrada.
function Telefono() {
  return (
    <div className="relative mx-auto min-h-dvh max-w-[430px] bg-ground">
      <Outlet />
    </div>
  )
}

function ArribaAlNavegar() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <ArribaAlNavegar />
    <Routes>
      <Route
        path="/tablero"
        element={
          <Suspense fallback={null}>
            <Tablero />
          </Suspense>
        }
      />
      <Route element={<Telefono />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/proximamente" element={<Proximamente />} />
        <Route path="/mi-kine" element={<MiKine />} />
        <Route path="/obra/:obraId" element={<Ficha />} />
        <Route path="/ver/:obraId" element={<Reproductor />} />
        <Route path="/final/:obraId/:recorridoId" element={<Cierre />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </HashRouter>,
)
