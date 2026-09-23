import { useEffect, useRef, useState } from 'react'
import logo from '../../imgs/logo.png'
import { readMenus } from '../services/menus'
import './digital-menu.css'

export function DigitalMenu() {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [page, setPage] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [imageError, setImageError] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    document.title = 'Menú digital | Exprés Charlys'
    const controller = new AbortController()
    let active = true
    const timer = window.setTimeout(() => controller.abort(), 15000)
    setLoading(true)
    setError(false)
    readMenus(controller.signal)
      .then(value => { if (active) { setImages(value); setPage(0) } })
      .catch(() => { if (active) setError(true) })
      .finally(() => { window.clearTimeout(timer); if (active) setLoading(false) })
    return () => { active = false; controller.abort(); window.clearTimeout(timer) }
  }, [attempt])
  useEffect(() => { setImageError(false) }, [page, attempt])
  useEffect(() => {
    if (!zoom) return
    dialog.current?.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [zoom])
  return (
    <div className="digital-menu">
      <header className="dm-header">
        <a className="dm-brand" href="/"><img src={logo} alt="" /><span>EXPRÉS CHARLYS<small>Rápido · Sabroso · A domicilio</small></span></a>
        <a className="dm-home" href="/">Ir al inicio ↗</a>
      </header>
      <main className="dm-main">
        <div className="dm-intro"><span className="dm-eyebrow">HECHO PARA DISFRUTAR</span><h1>¿Qué se te antoja hoy?</h1><p>Explora nuestro menú y encuentra tu próximo favorito.</p></div>
        {loading && <div className="dm-status" role="status">Preparando el menú…</div>}
        {error && <div className="dm-status" role="alert"><p>No pudimos cargar el menú.</p><button onClick={() => setAttempt(value => value + 1)}>Intentar de nuevo</button></div>}
        {!loading && !error && images.length > 0 && <>
          <div className="dm-toolbar"><label htmlFor="menu-page">Explora la carta</label><select id="menu-page" value={page} onChange={event => setPage(Number(event.target.value))}>{images.map((_, index) => <option key={index} value={index}>Página {index + 1} de {images.length}</option>)}</select></div>
          <div className="dm-viewer">
            {imageError ? <div className="dm-status" role="alert"><p>Esta imagen no se pudo cargar.</p><button onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div> : <button className="dm-image-button" onClick={() => setZoom(true)} aria-label={`Ampliar página ${page + 1} del menú`}><img key={`${page}-${attempt}`} src={images[page]} alt={`Carta de Exprés Charlys, página ${page + 1}. Amplía para leer los platillos y precios.`} onError={() => setImageError(true)} fetchPriority="high" /><span className="dm-enlarge">＋ Ampliar menú</span></button>}
          </div>
          <div className="dm-pagination"><button disabled={page === 0} onClick={() => setPage(value => value - 1)}>← Anterior</button><span aria-live="polite">{page + 1} / {images.length}</span><button disabled={page === images.length - 1} onClick={() => setPage(value => value + 1)}>Siguiente →</button></div>
          <p className="dm-hint">Toca la imagen para verla más grande. Puedes ampliar con dos dedos.</p>
        </>}
        <aside className="dm-order"><div><h2>Tu antojo, a domicilio.</h2><p>Haz tu pedido por WhatsApp y disfruta donde estés.</p></div><a href="https://wa.me/523921064092?text=Hola%2C%20quiero%20hacer%20un%20pedido%20del%20men%C3%BA" target="_blank" rel="noreferrer">Pedir por WhatsApp ↗</a></aside>
      </main>
      <footer className="dm-footer"><span>Exprés Charlys · Jazmín 204, esquina con Pípila</span><a href="/menu/qr">Compartir menú · QR</a></footer>
      {zoom && <dialog ref={dialog} className="dm-dialog" onCancel={() => setZoom(false)} onClose={() => setZoom(false)}><div className="dm-dialog-bar"><span>Página {page + 1}</span><button autoFocus onClick={() => setZoom(false)} aria-label="Cerrar imagen ampliada">Cerrar ×</button></div><div className="dm-zoom-scroll"><img src={images[page]} alt={`Menú ampliado, página ${page + 1}`} /></div></dialog>}
    </div>
  )
}

