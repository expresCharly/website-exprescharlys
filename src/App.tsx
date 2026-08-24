import { useEffect, useMemo, useRef, useState } from 'react'

import logoUrl from '../imgs/logo.png'
import kidsAreaOneUrl from '../imgs/area-de-ninos.jpeg'
import kidsAreaTwoUrl from '../imgs/area-de-ninos-2.jpeg'

type CategoryId = 'abarrotes' | 'farmacia' | 'restaurante'
type ModalId = CategoryId | 'carrito' | null

type Product = {
  name: string
  price: number
  icon: string
}

type Category = {
  id: CategoryId
  name: string
  icon: string
  products: Product[]
}

type CartItem = Product & {
  quantity: number
}

type Toast = {
  id: number
  message: string
}

const categories: Category[] = [
  {
    id: 'abarrotes',
    name: 'Abarrotes',
    icon: '🛒',
    products: [
      { icon: '🍞', name: 'Pan Dulce', price: 15 },
      { icon: '🥛', name: 'Leche Entera', price: 28.5 },
      { icon: '🥚', name: 'Huevos (12 pzs)', price: 45 },
      { icon: '🧼', name: 'Jabón de Barra', price: 12 },
      { icon: '🥫', name: 'Sopa Enlatada', price: 22 },
      { icon: '🍚', name: 'Arroz (1 kg)', price: 32 },
    ],
  },
  {
    id: 'farmacia',
    name: 'Farmacia',
    icon: '💊',
    products: [
      { icon: '💊', name: 'Paracetamol 500 mg', price: 35 },
      { icon: '🩹', name: 'Curitas', price: 25 },
      { icon: '🧴', name: 'Alcohol 96°', price: 40 },
      { icon: '🌡️', name: 'Termómetro', price: 80 },
      { icon: '🤧', name: 'Jarabe para la tos', price: 95 },
      { icon: '💊', name: 'Ibuprofeno', price: 45 },
    ],
  },
  {
    id: 'restaurante',
    name: 'Restaurante',
    icon: '🍽️',
    products: [
      { icon: '🍔', name: 'Hamburguesa Sencilla', price: 65 },
      { icon: '🍔', name: 'Hamburguesa Especial', price: 85 },
      { icon: '🍟', name: 'Papas a la Francesa', price: 40 },
      { icon: '🌭', name: 'Hot Dog', price: 35 },
      { icon: '🥤', name: 'Refresco de Cola', price: 25 },
      { icon: '🍰', name: 'Rebanada de Pastel', price: 55 },
    ],
  },
]

const menuImages = [
  'menu_1.png',
  'menu_4-6.png',
  'menu_7-10.png',
  'menu_11.png',
  'menu_14.png',
  'menu_15.png',
  'menu_16.png',
  'menu_17.png',
  'menu_18.png',
  'menu_19.png',
  'menu_20.png',
  'menu_21.png',
  'menu_22.png',
  'menu_23.png',
  'menu_24.png',
  'menu_25.png',
  'menu_26.png',
].map((fileName) => new URL(`../imgs/menus/${fileName}`, import.meta.url).href)

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

const kidsAreaImages = [
  { src: kidsAreaOneUrl, alt: 'Área infantil de Expres Charlys con alberca de pelotas' },
  { src: kidsAreaTwoUrl, alt: 'Segunda vista del área infantil de Expres Charlys' },
]

const aboutImages = Array.from({ length: 11 }, (_, index) => ({
  src: new URL(`../imgs/conocenos/${index + 1}.jpeg`, import.meta.url).href,
  alt: `Instalaciones de Expres Charlys, fotografía ${index + 1}`,
}))

function useRevealOnScroll() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.1 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}

function App() {
  const [activeModal, setActiveModal] = useState<ModalId>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [kidsSlide, setKidsSlide] = useState(0)
  const [aboutSlide, setAboutSlide] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toastId = useRef(0)
  const menuCarouselRef = useRef<HTMLDivElement>(null)

  useRevealOnScroll()

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  )
  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  )
  const selectedCategory = categories.find((category) => category.id === activeModal)

  useEffect(() => {
    document.body.style.overflow = activeModal || sidebarOpen ? 'hidden' : ''
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveModal(null)
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeModal, sidebarOpen])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const interval = window.setInterval(() => {
      setKidsSlide((current) => (current + 1) % kidsAreaImages.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const interval = window.setInterval(() => {
      setAboutSlide((current) => (current + 1) % aboutImages.length)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [])

  const showToast = (message: string) => {
    const id = ++toastId.current
    setToasts((current) => [...current, { id, message }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 2800)
  }

  const addToCart = (product: Product) => {
    setCart((current) => {
      const item = current.find((candidate) => candidate.name === product.name)
      if (!item) return [...current, { ...product, quantity: 1 }]
      return current.map((candidate) =>
        candidate.name === product.name
          ? { ...candidate, quantity: candidate.quantity + 1 }
          : candidate,
      )
    })
    showToast(`🛒 Se agregó ${product.name} al carrito`)
  }

  const removeFromCart = (productName: string) => {
    setCart((current) =>
      current
        .map((item) =>
          item.name === productName ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const checkout = () => {
    if (cart.length === 0) {
      showToast('Tu carrito está vacío.')
      return
    }

    const lines = cart.map(
      (item) => `- ${item.quantity}x ${item.name} (${money.format(item.price * item.quantity)})`,
    )
    const message = [
      'Hola *Expres Charlys*, quiero hacer el siguiente pedido:',
      '',
      ...lines,
      '',
      `*Total: ${money.format(cartTotal)}*`,
      '',
      'Quedo atento para coordinar la entrega.',
    ].join('\n')

    window.open(
      `https://wa.me/523921064092?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const scrollMenu = (direction: -1 | 1) => {
    const carousel = menuCarouselRef.current
    if (!carousel) return
    carousel.scrollBy({
      left: carousel.clientWidth * 0.9 * direction,
      behavior: 'smooth',
    })
  }

  return (
    <>
      <a
        className="whatsapp-float"
        href="https://wa.me/523921064092"
        target="_blank"
        rel="noreferrer"
        title="Escríbenos por WhatsApp"
        aria-label="Escríbenos por WhatsApp"
      >
        💬
      </a>

      <button
        className="sidebar-toggle"
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir navegación"
        aria-expanded={sidebarOpen}
      >
        ☰
      </button>
      <button
        className={`sidebar-backdrop${sidebarOpen ? ' active' : ''}`}
        type="button"
        onClick={() => setSidebarOpen(false)}
        aria-label="Cerrar navegación"
      />
      <nav
        className={`sidebar${sidebarOpen ? ' open' : ''}`}
        aria-label="Navegación principal"
      >
        <button
          className="sidebar-close"
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar navegación"
        >
          
        </button>
        <div className="nav-right">
          <ul className="nav-links">
            <li><a href="#productos" onClick={() => setSidebarOpen(false)}><span aria-hidden="true">🛒</span> Productos</a></li>
            <li><a href="#comida" onClick={() => setSidebarOpen(false)}><span aria-hidden="true">🍽️</span> Comida</a></li>
            <li><a href="#conocenos" onClick={() => setSidebarOpen(false)}><span aria-hidden="true">👋</span> Conócenos</a></li>
            <li><a href="#delivery" onClick={() => setSidebarOpen(false)}><span aria-hidden="true">🛵</span> Delivery</a></li>
            <li><a href="#contacto" onClick={() => setSidebarOpen(false)}><span aria-hidden="true">📍</span> Contactos</a></li>
          </ul>
          <button
            className="cart-btn-fixed"
            type="button"
            onClick={() => {
              setSidebarOpen(false)
              setActiveModal('carrito')
            }}
            aria-label={`Abrir carrito, ${cartCount} productos`}
          >
            🛒 <span className="cart-badge">{cartCount}</span>
          </button>
        </div>
      </nav>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-glow" />
          <div className="hero-content">
            <img className="hero-logo-img" src={logoUrl} alt="Expres Charlys" />
            <div className="hero-address"><span>📍</span> Jazmín 204 Esquina con Pípila</div>
            <div className="hero-cta">
              <a href="#comida" className="btn btn-yellow">Ver Menús 🍕</a>
              <a href="#productos" className="btn btn-outline">Productos 🛒</a>
              <a href="#conocenos" className="btn btn-outline">Conócenos 👋</a>
            </div>
          </div>
        </section>

        <div className="divider" />

        <section className="section products-section" id="productos">
          <div className="container">
            <div className="center">
              <div className="section-label">🛒 Todo en un solo lugar</div>
              <h2 className="section-title">Lo que encontrarás</h2>
            </div>
            <div className="products-grid reveal">
              {categories.map((category) => (
                <button
                  className="pcard"
                  type="button"
                  key={category.id}
                  onClick={() => setActiveModal(category.id)}
                >
                  <span className="icon">{category.icon}</span>
                  <span className="name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        <section className="section kids-section reveal" id="conocenos">
          <div className="container">
            <div className="kids-about-grid">
              <article className="about-card">
                <div>
                  <div className="about-label">👋 Conócenos</div>
                  <h2 className="about-title">Todo lo que necesitas, cerca de ti</h2>
                  <p className="about-description">
                    En <strong>Expres Charlys</strong> reunimos abarrotes, farmacia,
                    restaurante y comida caliente en un solo lugar. Queremos que
                    encuentres calidad, rapidez y atención cercana cada vez que nos visites.
                  </p>
                </div>
                <div
                  className="about-carousel"
                  role="region"
                  aria-roledescription="carrusel"
                  aria-label="Fotos de Expres Charlys"
                >
                  <img
                    key={aboutImages[aboutSlide].src}
                    src={aboutImages[aboutSlide].src}
                    alt={aboutImages[aboutSlide].alt}
                    className="about-carousel-image"
                  />
                  <button
                    className="carousel-arrow carousel-arrow-prev"
                    type="button"
                    onClick={() =>
                      setAboutSlide(
                        (current) =>
                          (current - 1 + aboutImages.length) % aboutImages.length,
                      )
                    }
                    aria-label="Ver fotografía anterior de Expres Charlys"
                  >
                    ‹
                  </button>
                  <button
                    className="carousel-arrow carousel-arrow-next"
                    type="button"
                    onClick={() =>
                      setAboutSlide((current) => (current + 1) % aboutImages.length)
                    }
                    aria-label="Ver siguiente fotografía de Expres Charlys"
                  >
                    ›
                  </button>
                  <div className="carousel-dots" aria-label="Elegir fotografía">
                    {aboutImages.map((image, index) => (
                      <button
                        className={`carousel-dot${index === aboutSlide ? ' active' : ''}`}
                        type="button"
                        key={image.src}
                        onClick={() => setAboutSlide(index)}
                        aria-label={`Ver fotografía ${index + 1}`}
                        aria-current={index === aboutSlide ? 'true' : undefined}
                      />
                    ))}
                  </div>
                </div>
                <div className="about-features" aria-label="Nuestros servicios">
                  <span>🛒 Abarrotes</span>
                  <span>💊 Farmacia</span>
                  <span>🍽️ Restaurante</span>
                </div>
                <div className="about-location">
                  <span aria-hidden="true">📍</span>
                  <span>Jazmín 204, esquina con Pípila</span>
                </div>
              </article>

              <article className="kids-card">
                <div className="kids-card-heading">
                  <span>🎈 Diversión para los pequeños</span>
                  <h2>Área de recreación para niños</h2>
                  <p>Un espacio pensado para que disfruten durante tu visita.</p>
                </div>
                <div
                  className="kids-carousel"
                  role="region"
                  aria-roledescription="carrusel"
                  aria-label="Fotos del área infantil"
                >
                  <img
                    key={kidsAreaImages[kidsSlide].src}
                    src={kidsAreaImages[kidsSlide].src}
                    alt={kidsAreaImages[kidsSlide].alt}
                    className="kids-carousel-image"
                  />
                  <button
                    className="carousel-arrow carousel-arrow-prev"
                    type="button"
                    onClick={() =>
                      setKidsSlide(
                        (current) =>
                          (current - 1 + kidsAreaImages.length) % kidsAreaImages.length,
                      )
                    }
                    aria-label="Ver imagen anterior"
                  >
                    ‹
                  </button>
                  <button
                    className="carousel-arrow carousel-arrow-next"
                    type="button"
                    onClick={() =>
                      setKidsSlide((current) => (current + 1) % kidsAreaImages.length)
                    }
                    aria-label="Ver imagen siguiente"
                  >
                    ›
                  </button>
                  <div className="carousel-dots" aria-label="Elegir imagen">
                    {kidsAreaImages.map((image, index) => (
                      <button
                        className={`carousel-dot${index === kidsSlide ? ' active' : ''}`}
                        type="button"
                        key={image.src}
                        onClick={() => setKidsSlide(index)}
                        aria-label={`Ver imagen ${index + 1}`}
                        aria-current={index === kidsSlide ? 'true' : undefined}
                      />
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <div className="divider" />

        <section className="section food-section" id="comida">
          <div className="container">
            <div className="center">
              <div className="section-label">🔥 Disponible todos los días</div>
              <h2 className="section-title">Comida Caliente</h2>
            </div>
            <div className="menu-carousel-shell reveal">
              <button
                className="menu-nav menu-nav-prev"
                type="button"
                onClick={() => scrollMenu(-1)}
                aria-label="Ver menús anteriores"
              >
                ‹
              </button>
              <div
                className="menus-grid"
                ref={menuCarouselRef}
                aria-label="Carrusel de menús de Expres Charlys"
              >
                {menuImages.map((image, index) => (
                  <figure className="menu-card" key={image}>
                    <img
                      src={image}
                      alt={`Menú ${index + 1} de Expres Charlys`}
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </figure>
                ))}
              </div>
              <button
                className="menu-nav menu-nav-next"
                type="button"
                onClick={() => scrollMenu(1)}
                aria-label="Ver más menús"
              >
                ›
              </button>
              <p className="menu-swipe-hint">Desliza para ver todos los menús</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        <section className="section delivery-section" id="delivery">
          <div className="container">
            <div className="delivery-inner">
              <div>
                <div className="section-label">🛵 Servicio disponible</div>
                <h2 className="section-title">Servicio a Domicilio</h2>
                <p className="delivery-desc">
                  <strong>¡Ya contamos con servicio a domicilio!</strong><br />
                  Rápido, fácil y directo hasta tu casa.
                </p>
              </div>
              <div className="reveal">
                <div className="delivery-badge">
                  <div className="rider">🛵</div>
                  <div className="tagline">Rápido · Sabroso · A Domicilio</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contacto">
        <img src={logoUrl} alt="Expres Charlys" />
        <p className="footer-sub">Tu supermercado rápido, completo y cerca de ti</p>
        <div className="footer-info">
          <span>📍 Jazmín 204 Esquina con Pípila</span>
          <span>🎉 ¡Ya estamos abiertos!</span>
        </div>
        <p className="copy">© {new Date().getFullYear()} Expres Charlys. Todos los derechos reservados.</p>
      </footer>

      {selectedCategory && (
        <div
          className="modal-overlay active"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveModal(null)
          }}
        >
          <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="category-title">
            <button className="modal-close" type="button" onClick={() => setActiveModal(null)} aria-label="Cerrar">×</button>
            <h3 id="category-title">{selectedCategory.icon} {selectedCategory.name}</h3>
            <div className="modal-products-grid">
              {selectedCategory.products.map((product) => (
                <article className="m-product" key={product.name}>
                  <span>{product.icon}</span>
                  <div>{product.name}</div>
                  <div className="m-price">{money.format(product.price)}</div>
                  <button className="add-to-cart-btn" type="button" onClick={() => addToCart(product)}>
                    Agregar +
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeModal === 'carrito' && (
        <div
          className="modal-overlay active"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveModal(null)
          }}
        >
          <section className="modal-content cart-modal-content" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <button className="modal-close" type="button" onClick={() => setActiveModal(null)} aria-label="Cerrar">×</button>
            <h3 id="cart-title">🛒 Tu Pedido</h3>
            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="empty-cart-msg">Tu carrito está vacío.</p>
              ) : (
                cart.map((item) => (
                  <div className="cart-item" key={item.name}>
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p>{money.format(item.price)}</p>
                    </div>
                    <div className="cart-item-actions">
                      <button className="qty-btn" type="button" onClick={() => removeFromCart(item.name)} aria-label={`Quitar un ${item.name}`}>−</button>
                      <span className="cart-quantity">{item.quantity}</span>
                      <button className="qty-btn" type="button" onClick={() => addToCart(item)} aria-label={`Agregar un ${item.name}`}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="cart-footer">
              <div className="cart-total">Total: <span>{money.format(cartTotal)}</span></div>
              <button className="checkout-btn" type="button" onClick={checkout}>
                Hacer Pedido por WhatsApp 📲
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className="toast show" key={toast.id}>{toast.message}</div>
        ))}
      </div>
    </>
  )
}

export default App
