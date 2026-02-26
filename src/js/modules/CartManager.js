/**
 * Cart Manager Module
 * Handles all cart operations with localStorage persistence.
 * Enforces stock‑quantity caps (don't allow adding more than available SKUs).
 * @module CartManager
 */

const STORAGE_KEY = 'loomSaga_cart';
export const CART_UPDATED_EVENT = 'loomSaga:cart-updated';

function emitCartUpdated(items) {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { items } }));
}

/**
 * Get all cart items
 * @returns {Array} Cart items array
 */
export function getItems() {
  const items = localStorage.getItem(STORAGE_KEY);
  return items ? JSON.parse(items) : [];
}

/**
 * Save cart items to localStorage
 * @param {Array} items - Cart items array
 */
export function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  updateBadge();
  emitCartUpdated(items);
}

/**
 * Add item to cart.
 * Respects stockQuantity — will not add beyond available stock.
 * @param {Object} product - Product object with id, name, price, image, stockQuantity
 * @returns {{ success: boolean, message: string }}
 */
export function addItem(product) {
  const parsedStockQuantity = Number(product.stockQuantity);
  const stockQuantity = Number.isFinite(parsedStockQuantity) ? parsedStockQuantity : 0;

  // Defensive guard: only purchasable products can ever enter cart state.
  if (product.inStock !== true || stockQuantity <= 0) {
    return { success: false, message: 'Out of stock' };
  }

  const items = getItems();
  const existingIndex = items.findIndex(item => String(item.id) === String(product.id));

  const currentQty = existingIndex > -1 ? items[existingIndex].quantity : 0;
  const maxStock = stockQuantity;

  // ── Stock-limit guard ──
  if (currentQty >= maxStock) {
    showNotification(
      maxStock === 0
        ? `${product.name} is out of stock`
        : `Maximum available quantity (${maxStock}) already in cart`
    );
    return { success: false, message: 'Stock limit reached' };
  }

  if (existingIndex > -1) {
    items[existingIndex].quantity += 1;
    // Keep stockQuantity up-to-date in the cart entry
    items[existingIndex].stockQuantity = maxStock;
    items[existingIndex].inStock = true;
    // Backfill color/style if missing (backwards compat)
    if (!items[existingIndex].color && product.color) items[existingIndex].color = product.color;
    if (!items[existingIndex].style && product.style) items[existingIndex].style = product.style;
  } else {
    items.push({
      id: String(product.id),
      name: product.name,
      price: parseFloat(product.price),
      image: product.image || product.primaryImage || '',
      quantity: 1,
      stockQuantity: maxStock,
      inStock: true,
      color: product.color || 'Unknown',
      style: product.style || 'Unknown'
    });
  }

  saveItems(items);
  showNotification(`${product.name} added to cart`);
  return { success: true, message: 'Added' };
}

/**
 * Remove item from cart
 * @param {string} productId - Product ID to remove
 */
export function removeItem(productId) {
  const items = getItems().filter(item => String(item.id) !== String(productId));
  saveItems(items);
}

/**
 * Update item quantity (respects stock limits)
 * @param {string} productId - Product ID
 * @param {number} quantity  - Desired new quantity
 * @returns {{ success: boolean, message: string }}
 */
export function updateQuantity(productId, quantity) {
  const items = getItems();
  const itemIndex = items.findIndex(item => String(item.id) === String(productId));

  if (itemIndex > -1) {
    const maxStock = items[itemIndex].stockQuantity ?? null;

    if (quantity <= 0) {
      items.splice(itemIndex, 1);
    } else if (maxStock !== null && quantity > maxStock) {
      showNotification(`Only ${maxStock} available`);
      items[itemIndex].quantity = maxStock;
    } else {
      items[itemIndex].quantity = quantity;
    }
    saveItems(items);
  }

  return { success: true, message: 'Updated' };
}

/**
 * Get cart total
 * @returns {number} Total price
 */
export function getTotal() {
  return getItems().reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

/**
 * Get total items count
 * @returns {number} Total items
 */
export function getItemCount() {
  return getItems().reduce((count, item) => count + item.quantity, 0);
}

/**
 * Update cart badge in header
 */
export function updateBadge() {
  const badge = document.getElementById('cartBadge');
  const countEl = document.getElementById('cartCount');
  const count = getItemCount();

  // Some pages use cartBadge, others cartCount
  [badge, countEl].filter(Boolean).forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/**
 * Format price in Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted price
 */
export function formatPrice(amount) {
  const safeAmount = Number(amount) || 0;
  return `Rs. ${safeAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Show notification toast
 * @param {string} message - Message to show
 */
export function showNotification(message) {
  // Remove existing notification
  const existing = document.querySelector('.cart-notification');
  if (existing) existing.remove();

  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.innerHTML = `
    <span>${message}</span>
    <a href="cart.html" class="notification-link">View Cart</a>
  `;

  document.body.appendChild(notification);

  // Trigger animation
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Removed saveSuspendedCart to prevent cart clearing

/**
 * Restore suspended cart from session storage
 */
export function restoreSuspendedCart() {
  const suspended = sessionStorage.getItem('loomSaga_suspendedCart');
  if (suspended) {
    saveItems(JSON.parse(suspended));
    sessionStorage.removeItem('loomSaga_suspendedCart');

    // Dispatch event to force CartRenderer to update
    const event = new CustomEvent('cartUpdated');
    window.dispatchEvent(event);
  }
}

// Object export for backward compatibility
const CartManager = {
  getItems,
  saveItems,
  addItem,
  removeItem,
  updateQuantity,
  getTotal,
  getItemCount,
  updateBadge,
  formatPrice,
  showNotification,
  restoreSuspendedCart
};

export default CartManager;
