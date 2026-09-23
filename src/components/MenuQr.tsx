import logo from '../../imgs/logo_sin_fondo.png'
import './digital-menu.css'

export function MenuQr() {
  return <main className="dm-qr-page">
    <div className="dm-qr-actions"><a href="/menu">← Ver menú</a><button onClick={() => window.print()}>Imprimir tarjeta</button><a href="/menu-qr.svg" download="expres-charlys-menu-qr.svg">Descargar QR</a></div>
    <article className="dm-qr-card"><img className="dm-qr-logo" src={logo} alt="Exprés Charlys" /><span className="dm-eyebrow">BIENVENIDO A TU PRÓXIMO ANTOJO</span><h1>Elige. Antójate.<br />Disfruta.</h1><p>Escanea y descubre nuestro menú.</p><img className="dm-qr-code" src="/menu-qr.svg" width="320" height="320" alt="Código QR para abrir el menú digital de Exprés Charlys" /><strong>Abre la cámara de tu celular<br />y apunta al código QR.</strong><a href="https://website-exprescharlys.vercel.app/menu">website-exprescharlys.vercel.app/menu</a><small>EXPRÉS CHARLYS · RÁPIDO, SABROSO, A DOMICILIO</small></article>
  </main>
}
