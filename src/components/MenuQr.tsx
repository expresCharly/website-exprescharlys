import { useEffect, useRef, useState } from 'react'
import logo from '../../imgs/logo_sin_fondo.png'
import './digital-menu.css'

export function MenuQr() {
  const card = useRef<HTMLElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('Preparando imagen…')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const element = card.current
    if (!element) return
    let version = 0
    let timer = 0
    const prepare = () => {
      const current = ++version
      window.clearTimeout(timer)
      setFile(null)
      setFailed(false)
      setStatus('Preparando imagen…')
      timer = window.setTimeout(async () => {
        try {
          await document.fonts.ready
          await Promise.all(Array.from(element.querySelectorAll('img'), image => image.decode()))
          const { default: html2canvas } = await import('html2canvas')
          if (current !== version) return
          const canvas = await html2canvas(element, {
            scale: 3,
            backgroundColor: getComputedStyle(element).backgroundColor,
            // Renderizar el HTML completo; el método SVG omitía fondo y texto.
            foreignObjectRendering: false,
            useCORS: true,
            logging: false,
          })
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
          if (!blob) throw new Error('No se pudo generar la imagen')
          if (current !== version) return
          setFile(new File([blob], 'menu-expres-charlys.png', { type: 'image/png' }))
          setStatus('')
        } catch {
          if (current !== version) return
          setFailed(true)
          setStatus('No pudimos preparar la imagen. Pulsa Compartir para reintentar.')
        }
      }, 250)
    }
    const observer = new ResizeObserver(prepare)
    observer.observe(element)
    return () => { ++version; window.clearTimeout(timer); observer.disconnect() }
  }, [attempt])

  const share = async () => {
    if (!file) { setAttempt(value => value + 1); return }
    setBusy(true)
    const download = () => {
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
      setStatus('Imagen descargada. Ya puedes compartirla.')
    }
    try {
      // Preparar antes conserva el gesto del usuario al compartir desde el celular.
      const mobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      if (mobileDevice && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Menú de Exprés Charlys' })
        setStatus('')
      } else download()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') setStatus('')
      else download()
    } finally { setBusy(false) }
  }

  return <main className="dm-qr-page">
    <div className="dm-qr-actions"><a href="/menu">← Ver menú</a><button onClick={share} disabled={busy || (!file && !failed)}>Compartir</button></div>
    <p className="dm-share-status" role="status">{status}</p>
    <article ref={card} className="dm-qr-card">
      <img className="dm-qr-logo" src={logo} alt="Exprés Charlys" />
      <span className="dm-eyebrow">BIENVENIDO A TU PRÓXIMO ANTOJO</span>
      <h1>Elige. Antójate.<br />Disfruta.</h1>
      <p>Escanea y descubre nuestro menú.</p>
      {/* El PNG evita diferencias de escala al rasterizar SVG en navegadores móviles. */}
      <img className="dm-qr-code" src="/menu-qr.png" width="1200" height="1200" alt="Código QR para abrir el menú digital de Exprés Charlys" />
      <strong>Abre la cámara de tu celular<br />y apunta al código QR.</strong>
      <a href="https://website-exprescharlys.vercel.app/menu">website-exprescharlys.vercel.app/menu</a>
      <small>EXPRÉS CHARLYS · RÁPIDO, SABROSO, A DOMICILIO</small>
    </article>
  </main>
}


