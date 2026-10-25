import { restaurantPhone, restaurantPhoneHref } from '../data/contact'
import './restaurant-contact.css'

export function PhoneIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.79a2 2 0 0 1-.45 2.11L8.08 9.89a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.33 1.83.56 2.79.69A2 2 0 0 1 22 16.92z" /></svg>
}

export function RestaurantContact({ compact = false }: { compact?: boolean }) {
  return <div className={`restaurant-contact${compact ? ' restaurant-contact--compact' : ''}`}>
    <div className="restaurant-contact-copy">
      <span className="restaurant-contact-label">Restaurante</span>
      <strong>Tu pedido, con una llamada.</strong>
      <span className="restaurant-contact-note">Llámanos para ordenar tus favoritos.</span>
    </div>
    <a className="restaurant-call" href={restaurantPhoneHref} aria-label={`Llamar al restaurante al ${restaurantPhone} para ordenar`}>
      <span className="restaurant-call-icon"><PhoneIcon /></span>
      <span><small>Llamar para ordenar</small><strong>392 688 1753</strong></span>
      <span className="restaurant-call-arrow" aria-hidden="true">↗</span>
    </a>
  </div>
}
