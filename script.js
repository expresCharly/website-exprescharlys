const opening = new Date('2025-06-01T08:00:00');

function tick() {
  const diff = opening - new Date();
  if (diff <= 0) { ['days','hours','minutes','seconds'].forEach(id => document.getElementById(id).textContent='00'); return; }
  document.getElementById('days').textContent    = String(Math.floor(diff/86400000)).padStart(2,'0');
  document.getElementById('hours').textContent   = String(Math.floor((diff%86400000)/3600000)).padStart(2,'0');
  document.getElementById('minutes').textContent = String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
  document.getElementById('seconds').textContent = String(Math.floor((diff%60000)/1000)).padStart(2,'0');
}

tick(); 
setInterval(tick, 1000);

const obs = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }), {threshold:0.1});
document.querySelectorAll('.reveal').forEach(r => obs.observe(r));

// Modal Logic
function openModal(id) {
  const modal = document.getElementById(id);
  if(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Event Listeners for Modal Triggers
document.querySelectorAll('.modal-trigger').forEach(trigger => {
  trigger.addEventListener('click', function() {
    const modalId = this.getAttribute('data-modal');
    if(modalId) openModal(modalId);
  });
});

// Event Listeners for Modal Close Buttons
document.querySelectorAll('.modal-close').forEach(closeBtn => {
  closeBtn.addEventListener('click', function() {
    const modalId = this.getAttribute('data-modal');
    if(modalId) closeModal(modalId);
  });
});

// Close modal when clicking outside content
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) {
      closeModal(this.id);
    }
  });
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      closeModal(modal.id);
    });
  }
});

// Cart Button Trigger
const cartBtnTrigger = document.getElementById('cart-btn-trigger');
if(cartBtnTrigger) {
  cartBtnTrigger.addEventListener('click', function() {
    openModal('modal-cart');
  });
}

// --- CART LOGIC ---
let cart = [];

function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if(existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  updateCartUI();
  showToast(`🛒 Se agregó ${name} al carrito`);
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if(!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function removeFromCart(name) {
  const index = cart.findIndex(item => item.name === name);
  if(index !== -1) {
    cart[index].qty -= 1;
    if(cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
  }
  updateCartUI();
}

function updateCartUI() {
  const countSpan = document.getElementById('cart-count');
  const container = document.getElementById('cart-items-container');
  const totalSpan = document.getElementById('cart-total-price');
  
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  countSpan.textContent = totalItems;

  container.innerHTML = '';
  if(cart.length === 0) {
    container.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
    totalSpan.textContent = '$0.00';
    return;
  }

  let totalPrice = 0;
  cart.forEach(item => {
    totalPrice += item.price * item.qty;
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>$${item.price.toFixed(2)}</p>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn" data-action="remove" data-product="${item.name}">-</button>
        <span style="width: 20px; text-align: center; font-weight: bold;">${item.qty}</span>
        <button class="qty-btn" data-action="add" data-product="${item.name}" data-price="${item.price}">+</button>
      </div>
    `;
    container.appendChild(itemEl);
  });

  totalSpan.textContent = '$' + totalPrice.toFixed(2);
  
  // Add event listeners to quantity buttons
  document.querySelectorAll('.cart-item-actions .qty-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      const productName = this.getAttribute('data-product');
      const price = this.getAttribute('data-price');
      
      if(action === 'remove') {
        removeFromCart(productName);
      } else if(action === 'add') {
        addToCart(productName, parseFloat(price));
      }
    });
  });
}

function checkout() {
  if(cart.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }
  let message = "Hola *Expres Charlys*, quiero hacer el siguiente pedido:%0A%0A";
  let total = 0;
  cart.forEach(item => {
    message += `- ${item.qty}x ${item.name} ($${(item.price * item.qty).toFixed(2)})%0A`;
    total += item.price * item.qty;
  });
  message += `%0A*Total: $${total.toFixed(2)}*%0A%0AQuedo atento para coordinar la entrega.`;
  
  const phone = "3921064092"; 
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

// Event Listener for Checkout Button
const checkoutBtn = document.getElementById('checkout-btn');
if(checkoutBtn) {
  checkoutBtn.addEventListener('click', checkout);
}

// Event Listeners for Add to Cart Buttons
document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const productName = this.getAttribute('data-product');
    const price = parseFloat(this.getAttribute('data-price'));
    if(productName && price) {
      addToCart(productName, price);
    }
  });
});