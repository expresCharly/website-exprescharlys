import { useEffect, useRef, useState } from 'react'
import logo from '../../imgs/logo.png'
import { readMenus } from '../services/menus'
import './digital-menu.css'

function MenuSheet({ src, index, total, onExpand }: { src: string; index: number; total: number; onExpand: () => void }) {
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  return <li className="dm-sheet">
    <div className="dm-sheet-heading"><span>Nuestra carta</span><span>{String(index + 1).padStart(2, '0')} / {total}</span></div>
    <div className="dm-viewer">
      {failed ? <div className="dm-status" role="alert"><p>No se pudo cargar esta parte del menú.</p><button onClick={() => { setRetry(value => value + 1); setFailed(false) }}>Reintentar imagen</button></div> :
        <button className="dm-image-button" onClick={onExpand} aria-label={`Ampliar página ${index + 1} del menú`}>
          <img key={retry} src={src} alt={`Carta de Exprés Charlys, página ${index + 1}. Amplía para leer los platillos y precios.`} width="1536" height="1024" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" fetchPriority={index === 0 ? 'high' : 'auto'} onError={() => setFailed(true)} />
          <span className="dm-enlarge">＋ Ampliar menú</span>
        </button>}
    </div>
  </li>
}

export function DigitalMenu() {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    document.title = 'Menú digital | Exprés Charlys'
    const controller = new AbortController()
    let active = true
    const timer = window.setTimeout(() => controller.abort(), 15000)
    setLoading(true)
    setError(false)
    readMenus(controller.signal)
      .then(value => { if (active) setImages(value) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { window.clearTimeout(timer); if (active) setLoading(false) })
    return () => { active = false; controller.abort(); window.clearTimeout(timer) }
  }, [attempt])
  useEffect(() => {
    if (selected === null) return
    const trigger = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous; trigger?.focus({ preventScroll: true }) }
  }, [selected])
  return (
    <div className="digital-menu">
      <header className="dm-header">
        <a className="dm-brand" href="/"><img src={logo} alt="" /><span>EXPRÉS CHARLYS<small>Rápido · Sabroso · A domicilio</small></span></a>
        <a className="dm-home" href="/">Ir al inicio ↗</a>
      </header>
      <main className="dm-main">
        <div className="dm-intro"><span className="dm-eyebrow">HECHO PARA DISFRUTAR</span><h1>¿Qué se te antoja hoy?</h1><p>Recorre nuestra carta y encuentra tu próximo favorito.</p><p className="dm-hint">Desliza hacia abajo · Toca cualquier imagen para ampliarla</p><a className="dm-share-qr" href="/menu/qr">Compartir QR</a></div>
        {loading && <div className="dm-status" role="status">Preparando el menú…</div>}
        {error && <div className="dm-status" role="alert"><p>No pudimos cargar el menú.</p><button onClick={() => setAttempt(value => value + 1)}>Intentar de nuevo</button></div>}
        {!loading && !error && <ol className="dm-letter" aria-label="Carta completa de Exprés Charlys">
          {images.map((src, index) => <MenuSheet key={src} src={src} index={index} total={images.length} onExpand={() => setSelected(index)} />)}
        </ol>}
        <aside className="dm-order"><div><h2>Tu antojo, a domicilio.</h2><p>Haz tu pedido por WhatsApp y disfruta donde estés.</p></div><a href="https://wa.me/523926881753?text=Hola%2C%20quiero%20hacer%20un%20pedido%20del%20men%C3%BA" target="_blank" rel="noreferrer">Pedir por WhatsApp ↗</a></aside>
      </main>
      <footer className="dm-footer"><span>Exprés Charlys · Jazmín 204, esquina con Pípila</span><a href="/menu/qr">Compartir menú · QR</a></footer>
      {selected !== null && <dialog ref={dialog} className="dm-dialog" aria-label={`Página ${selected + 1} ampliada`} onCancel={() => setSelected(null)} onClose={() => setSelected(null)}><div className="dm-dialog-bar"><span>Página {selected + 1}</span><button autoFocus onClick={() => setSelected(null)} aria-label="Cerrar imagen ampliada">Cerrar ×</button></div><div className="dm-zoom-scroll"><img src={images[selected]} alt={`Menú ampliado, página ${selected + 1}`} /></div></dialog>}
    </div>
  )
}
