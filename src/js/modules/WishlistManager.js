/**
 * Wishlist Manager Module
 * Handles wishlist operations with localStorage persistence
 * @module WishlistManager
 */

const STORAGE_KEY = 'loomSaga_wishlist';

/**
 * Get all wishlist items
 * @returns {Array} Wishlist items array
 */
export function getItems() {
  const items = localStorage.getItem(STORAGE_KEY);
  return items ? JSON.parse(items) : [];
}

/**
 * Save wishlist items to localStorage
 * @param {Array} items - Wishlist items array
 */
export function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  updateBadge();
}

/**
 * Check if product is in wishlist
 * @param {string} productId - Product ID
 * @returns {boolean} True if in wishlist
 */
export function isInWishlist(productId) {
  return getItems().some(item => item.id === productId);
}

/**
 * Toggle wishlist item
 * @param {Object} product - Product object
 * @returns {boolean} True if added, false if removed
 */
export function toggle(product) {
  const items = getItems();
  const existingIndex = items.findIndex(item => item.id === product.id);
  
  if (existingIndex > -1) {
    items.splice(existingIndex, 1);
    saveItems(items);
    showNotification(`${product.name} removed from wishlist`);
    return false;
  } else {
    items.push(product);
    saveItems(items);
    showNotification(`${product.name} added to wishlist`);
    return true;
  }
}

/**
 * Add item to wishlist
 * @param {Object} product - Product object
 */
export function addItem(product) {
  if (!isInWishlist(product.id)) {
    const items = getItems();
    items.push(product);
    saveItems(items);
    showNotification(`${product.name} added to wishlist`);
  }
}

/**
 * Remove item from wishlist
 * @param {string} productId - Product ID
 */
export function removeItem(productId) {
  const items = getItems().filter(item => item.id !== productId);
  saveItems(items);
  
  // Re-render wishlist if on wishlist page
  if (typeof window.renderWishlist === 'function') {
    window.renderWishlist();
  }
}

/**
 * Get wishlist count
 * @returns {number} Total items
 */
export function getCount() {
  return getItems().length;
}

/**
 * Update wishlist badge in header
 */
export function updateBadge() {
  const badge = document.getElementById('wishlistBadge');
  if (badge) {
    const count = getCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Show notification toast
 * @param {string} message - Message to show
 */
export function showNotification(message) {
  const existing = document.querySelector('.wishlist-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'wishlist-notification';
  notification.innerHTML = `
    <span>${message}</span>
    <a href="wishlist.html" class="notification-link">View Wishlist</a>
  `;
  
  document.body.appendChild(notification);
  
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Object export for backward compatibility
const WishlistManager = {
  getItems,
  saveItems,
  isInWishlist,
  toggle,
  addItem,
  removeItem,
  getCount,
  updateBadge,
  showNotification
};

export default WishlistManager;
