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
          const { toCanvas } = await import('html-to-image')
          if (current !== version) return
          const canvas = await toCanvas(element, { pixelRatio: 3, preferredFontFormat: 'woff2' })
          // Dibujar los originales directamente evita imágenes omitidas por el
          // renderizado SVG/foreignObject de algunos navegadores.
          const context = canvas.getContext('2d')
          if (!context) throw new Error('No se pudo preparar el lienzo')
          const bounds = element.getBoundingClientRect()
          context.save()
          context.scale(canvas.width / bounds.width, canvas.height / bounds.height)
          for (const image of element.querySelectorAll('img')) {
            const rect = image.getBoundingClientRect()
            const x = rect.left - bounds.left
            const y = rect.top - bounds.top
            context.save()
            context.beginPath()
            context.roundRect(x, y, rect.width, rect.height, parseFloat(getComputedStyle(image).borderRadius) || 0)
            context.clip()
            context.fillStyle = getComputedStyle(element).backgroundColor
            context.fillRect(x, y, rect.width, rect.height)
            context.drawImage(image, x, y, rect.width, rect.height)
            context.restore()
          }
          context.restore()
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
      <img className="dm-qr-code" src="/menu-qr.svg" width="320" height="320" alt="Código QR para abrir el menú digital de Exprés Charlys" />
      <strong>Abre la cámara de tu celular<br />y apunta al código QR.</strong>
      <a href="https://website-exprescharlys.vercel.app/menu">website-exprescharlys.vercel.app/menu</a>
      <small>EXPRÉS CHARLYS · RÁPIDO, SABROSO, A DOMICILIO</small>
    </article>
  </main>
}
