/**
 * Cart Renderer Module
 * Renders cart page + cart drawer UI from CartManager state.
 */
import CartManager from './CartManager.js';
import { CART_UPDATED_EVENT } from './CartManager.js';

function productUrl(productId) {
  return `/product-detail?id=${encodeURIComponent(String(productId))}`;
}

const CartRenderer = {
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.initDrawer();
    this.renderCart();
    this.renderDrawer();

    // Keep UI synced when cart changes anywhere in the app.
    window.addEventListener(CART_UPDATED_EVENT, () => {
      this.renderCart();
      this.renderDrawer();
    });

    // Backward compatibility hooks for older inline references.
    window.renderCart = () => this.renderCart();
    window.renderDrawer = () => this.renderDrawer();
  },

  renderCart() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartEmptyEl = document.getElementById('cartEmpty');
    const cartContentEl = document.getElementById('cartContent');
    if (!cartItemsEl) return;

    const items = CartManager.getItems();

    if (items.length === 0) {
      if (cartContentEl) cartContentEl.style.display = 'none';
      if (cartEmptyEl) {
        cartEmptyEl.style.display = 'block';

        const suspendedCart = sessionStorage.getItem('loomSaga_suspendedCart');
        let restoreBanner = document.getElementById('cartRestoreBanner');

        if (suspendedCart && JSON.parse(suspendedCart).length > 0) {
          if (!restoreBanner) {
            restoreBanner = document.createElement('div');
            restoreBanner.id = 'cartRestoreBanner';
            restoreBanner.style.marginTop = '2rem';
            restoreBanner.innerHTML = `
              <p style="margin-bottom:1rem;color:var(--color-text-light);">Did you back out of checkout?</p>
              <button id="restoreCartBtn" class="secondary-btn" style="width:auto;padding:0.75rem 2.5rem;font-size:0.9rem;">Restore Previous Cart</button>
            `;
            cartEmptyEl.appendChild(restoreBanner);

            document.getElementById('restoreCartBtn').addEventListener('click', () => {
              CartManager.restoreSuspendedCart();
            });
          }
          restoreBanner.style.display = 'block';
        } else if (restoreBanner) {
          restoreBanner.style.display = 'none';
        }
      }
      return;
    }

    if (cartContentEl) cartContentEl.style.display = 'block';
    if (cartEmptyEl) cartEmptyEl.style.display = 'none';

    cartItemsEl.innerHTML = items.map(item => {
      const maxReached = item.stockQuantity != null && item.quantity >= item.stockQuantity;
      const safeName = item.name || 'Product';
      const safeImage = item.image || '';
      const color = item.color || 'Unknown';
      const style = item.style || 'Unknown';

      return `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-product">
            <a href="${productUrl(item.id)}" class="cart-item-image-link" style="display:block;text-decoration:none;">
              <img src="${safeImage}" alt="${safeName}" class="cart-item-image">
            </a>
            <div class="cart-item-details">
              <a href="${productUrl(item.id)}" class="cart-item-name-link" style="text-decoration:none;color:inherit;">
                <h3 class="cart-item-name">${safeName}</h3>
              </a>
              <p class="cart-item-price">${CartManager.formatPrice(item.price)}</p>
              <div class="cart-item-meta">
                <span>Color: ${color}</span>
                <span>Style: ${style}</span>
              </div>
            </div>
          </div>
          <div class="cart-item-quantity">
            <div class="quantity-control">
              <button class="quantity-btn quantity-minus" data-id="${item.id}" aria-label="Decrease quantity">-</button>
              <span class="quantity-value">${item.quantity}</span>
              <button class="quantity-btn quantity-plus" data-id="${item.id}" aria-label="Increase quantity"${maxReached ? ' disabled title="Stock limit reached"' : ''}>+</button>
            </div>
            <button class="remove-btn" data-id="${item.id}" aria-label="Remove item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          <div class="cart-item-total-wrapper">
            <span class="cart-item-total">${CartManager.formatPrice(item.price * item.quantity)}</span>
          </div>
        </div>
      `;
    }).join('');

    const totalEl = document.getElementById('cartTotalAmount');
    if (totalEl) {
      totalEl.textContent = CartManager.formatPrice(CartManager.getTotal());
    }

    this.bindCartEvents();
  },

  bindCartEvents() {
    document.querySelectorAll('.quantity-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = CartManager.getItems().find(i => String(i.id) === String(id));
        if (item) CartManager.updateQuantity(id, item.quantity - 1);
      });
    });

    document.querySelectorAll('.quantity-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = CartManager.getItems().find(i => String(i.id) === String(id));
        if (item) CartManager.updateQuantity(id, item.quantity + 1);
      });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        CartManager.removeItem(id);
      });
    });
  },

  initDrawer() {
    const trigger = document.getElementById('cartTriggerBtn');
    const closeBtn = document.getElementById('drawerClose');
    const overlay = document.getElementById('cartOverlay');

    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeDrawer());
    }
  },

  openDrawer() {
    document.getElementById('cartDrawer')?.classList.add('active');
    document.getElementById('cartOverlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.renderDrawer();
  },

  closeDrawer() {
    document.getElementById('cartDrawer')?.classList.remove('active');
    document.getElementById('cartOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
  },

  renderDrawer() {
    const drawerItemsEl = document.getElementById('cartDrawerItems');
    const drawerTotalEl = document.getElementById('drawerTotalAmount');
    if (!drawerItemsEl) return;

    const items = CartManager.getItems();
    const drawerSubheader = document.querySelector('.cart-drawer-subheader');
    const drawerFooter = document.getElementById('cartDrawerFooter');
    const drawerEmpty = document.getElementById('cartDrawerEmpty');

    if (items.length === 0) {
      drawerItemsEl.style.display = 'none';
      if (drawerSubheader) drawerSubheader.style.display = 'none';
      if (drawerFooter) drawerFooter.style.display = 'none';

      if (drawerEmpty) {
        drawerEmpty.style.display = 'flex';

        const suspendedCart = sessionStorage.getItem('loomSaga_suspendedCart');
        let restoreBanner = document.getElementById('drawerRestoreBanner');

        if (suspendedCart && JSON.parse(suspendedCart).length > 0) {
          if (!restoreBanner) {
            restoreBanner = document.createElement('div');
            restoreBanner.id = 'drawerRestoreBanner';
            restoreBanner.style.marginTop = '1.5rem';
            restoreBanner.style.textAlign = 'center';
            restoreBanner.innerHTML = `
              <p style="margin-bottom:0.8rem;color:var(--color-text-light);">Back from checkout?</p>
              <button id="drawerRestoreCartBtn" class="secondary-btn" style="width:100%;padding:0.75rem;">Restore Cart</button>
            `;
            drawerEmpty.appendChild(restoreBanner);

            document.getElementById('drawerRestoreCartBtn').addEventListener('click', () => {
              CartManager.restoreSuspendedCart();
            });
          }
          restoreBanner.style.display = 'block';
        } else if (restoreBanner) {
          restoreBanner.style.display = 'none';
        }

      } else {
        drawerItemsEl.style.display = 'block';
        drawerItemsEl.innerHTML = '<div class="search-no-results" style="padding: 20px; text-align: center;">Your cart is empty</div>';
      }

      if (drawerTotalEl) drawerTotalEl.textContent = CartManager.formatPrice(0);
      return;
    }

    drawerItemsEl.style.display = 'block';
    if (drawerSubheader) drawerSubheader.style.display = 'flex';
    if (drawerFooter) drawerFooter.style.display = 'block';
    if (drawerEmpty) drawerEmpty.style.display = 'none';

    drawerItemsEl.innerHTML = items.map(item => {
      const maxReached = item.stockQuantity != null && item.quantity >= item.stockQuantity;
      const safeName = item.name || 'Product';
      const safeImage = item.image || '';
      const color = item.color || 'Unknown';
      const style = item.style || 'Unknown';

      return `
        <div class="drawer-item">
          <a href="${productUrl(item.id)}" class="drawer-item-image-link" style="display:block;text-decoration:none;flex-shrink:0;">
            <img src="${safeImage}" alt="${safeName}" class="drawer-item-image">
          </a>
          <div class="drawer-item-details">
            <a href="${productUrl(item.id)}" class="drawer-item-name-link" style="text-decoration:none;color:inherit;">
              <h4 class="drawer-item-name">${safeName}</h4>
            </a>
            <p class="drawer-item-price">${CartManager.formatPrice(item.price)}</p>
            <div class="drawer-item-meta">
              Color: ${color} <br>
              Style: ${style}
            </div>
            <div class="drawer-item-actions">
              <div class="drawer-quantity">
                <button class="drawer-qty-btn drawer-minus" data-id="${item.id}">-</button>
                <span class="drawer-qty-val">${item.quantity}</span>
                <button class="drawer-qty-btn drawer-plus" data-id="${item.id}"${maxReached ? ' disabled title="Stock limit reached"' : ''}>+</button>
              </div>
              <button class="drawer-remove-btn" data-id="${item.id}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (drawerTotalEl) {
      drawerTotalEl.textContent = CartManager.formatPrice(CartManager.getTotal());
    }

    this.bindDrawerItemEvents();
  },

  bindDrawerItemEvents() {
    document.querySelectorAll('.drawer-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = CartManager.getItems().find(i => String(i.id) === String(id));
        if (item) CartManager.updateQuantity(id, item.quantity - 1);
      });
    });

    document.querySelectorAll('.drawer-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = CartManager.getItems().find(i => String(i.id) === String(id));
        if (item) CartManager.updateQuantity(id, item.quantity + 1);
      });
    });

    document.querySelectorAll('.drawer-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        CartManager.removeItem(id);
      });
    });
  }
};

export default CartRenderer;
