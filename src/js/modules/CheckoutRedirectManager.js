/**
 * Checkout Redirect Manager
 * Redirects cart checkout actions to the serverless WooCommerce checkout endpoint.
 */
import CartManager from './CartManager.js';

const CHECKOUT_BTN_SELECTOR = '#checkoutBtn, .drawer-checkout-btn';

const CheckoutRedirectManager = {
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const checkoutBtns = document.querySelectorAll(CHECKOUT_BTN_SELECTOR);
    checkoutBtns.forEach(button => {
      if (button.dataset.checkoutBound === 'true') return;
      button.dataset.checkoutBound = 'true';
      button.removeAttribute('onclick');
      button.addEventListener('click', (event) => this.handleCheckoutClick(event, button));
    });
  },

  async handleCheckoutClick(event, button) {
    event.preventDefault();

    const items = CartManager.getItems().map(item => ({
      id: item.id,
      quantity: item.quantity
    }));

    if (items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const originalText = button.textContent;
    button.textContent = 'PREPARING CHECKOUT...';
    button.style.pointerEvents = 'none';
    button.style.opacity = '0.7';

    try {
      // Include Authorization header if the user is logged in
      const headers = { 'Content-Type': 'application/json' };
      const AuthManager = window.AuthManager || (await import('./AuthManager.js')).AuthManager;
      if (AuthManager && AuthManager.getToken()) {
        headers['Authorization'] = `Bearer ${AuthManager.getToken()}`;
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ items })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || 'Failed to get checkout URL');
      }

      // Clear the cart before redirecting so that hitting the back button will show an empty cart
      // BUT save it to a suspended state first so the user can restore it if they backed out
      CartManager.saveSuspendedCart(items);
      CartManager.saveItems([]);

      window.location.href = payload.url;
    } catch (error) {
      console.error('Checkout redirect failed:', error);
      alert('Unable to redirect to secure checkout right now. Please try again.');
      button.textContent = originalText;
      button.style.pointerEvents = 'auto';
      button.style.opacity = '1';
    }
  }
};

export default CheckoutRedirectManager;
