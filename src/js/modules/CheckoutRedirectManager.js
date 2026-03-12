/**
 * Checkout Redirect Manager
 * Redirects cart checkout actions to the serverless WooCommerce checkout endpoint.
 */
import CartManager from './CartManager.js';
import { AuthManager } from './AuthManager.js';

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
    console.log('--- NEW CHECKOUT REDIRECT LOGIC v5 RUNNING ---');
    console.log('If you see this, the cache has been successfully bypassed, and no cart clearing should happen natively!');

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
      
      if (AuthManager && AuthManager.getToken()) {
        headers['Authorization'] = `Bearer ${AuthManager.getToken()}`;
      }

      // Build customer profile from session for checkout pre-fill
      let customer = null;
      if (AuthManager && AuthManager.isLoggedIn()) {
        const session = AuthManager.getSession();
        if (session) {
          let first = session.firstName || '';
          let last = session.lastName || '';

          // Fallback: derive name from displayName if first/last are missing
          if (!first && session.displayName) {
            const parts = session.displayName.trim().split(/\s+/);
            first = parts[0] || '';
            last = parts.slice(1).join(' ') || '';
          }

          customer = {
            email: session.email || '',
            firstName: first,
            lastName: last
          };
        }
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ items, customer })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || 'Failed to get checkout URL');
      }

      // Keep the cart intact during the redirect to prevent "Your cart is empty" flash.
      // The cart will be cleared automatically on the order-confirmation page.

      // Use location.replace() so the WooCommerce checkout URL does NOT enter 
      // browser history. Pressing "Back" will skip past WooCommerce entirely.
      window.location.replace(payload.url);
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
