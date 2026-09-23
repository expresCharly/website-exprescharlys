import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import '../style.css'

const App = lazy(() => import('./App'))
const DigitalMenu = lazy(() => import('./components/DigitalMenu').then(module => ({ default: module.DigitalMenu })))
const MenuQr = lazy(() => import('./components/MenuQr').then(module => ({ default: module.MenuQr })))
const path = window.location.pathname.replace(/\/+$/, '')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<p role="status" style={{ padding: 24 }}>Cargando…</p>}>
      {path === '/menu' ? <DigitalMenu /> : path === '/menu/qr' ? <MenuQr /> : <App />}
    </Suspense>
  </React.StrictMode>,
)
