/**
 * Cart Manager Module
 * Handles all cart operations with localStorage persistence
 * @module CartManager
 */

const STORAGE_KEY = 'loomSaga_cart';

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
}

/**
 * Add item to cart
 * @param {Object} product - Product object with id, name, price, image
 */
export function addItem(product) {
  const items = getItems();
  const existingIndex = items.findIndex(item => item.id === product.id);
  
  if (existingIndex > -1) {
    items[existingIndex].quantity += 1;
  } else {
    items.push({
      ...product,
      quantity: 1
    });
  }
  
  saveItems(items);
  showNotification(`${product.name} added to cart`);
}

/**
 * Remove item from cart
 * @param {string} productId - Product ID to remove
 */
export function removeItem(productId) {
  const items = getItems().filter(item => item.id !== productId);
  saveItems(items);
  
  // Re-render cart if on cart page
  if (typeof window.renderCart === 'function') {
    window.renderCart();
  }
}

/**
 * Update item quantity
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 */
export function updateQuantity(productId, quantity) {
  const items = getItems();
  const itemIndex = items.findIndex(item => item.id === productId);
  
  if (itemIndex > -1) {
    if (quantity <= 0) {
      items.splice(itemIndex, 1);
    } else {
      items[itemIndex].quantity = quantity;
    }
    saveItems(items);
  }
  
  // Re-render cart if on cart page
  if (typeof window.renderCart === 'function') {
    window.renderCart();
  }
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
  if (badge) {
    const count = getItemCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Format price in Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted price
 */
export function formatPrice(amount) {
  return `Rs. ${amount.toLocaleString('en-IN', { 
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
  showNotification
};

export default CartManager;
