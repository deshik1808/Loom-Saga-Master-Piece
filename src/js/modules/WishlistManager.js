/**
 * Wishlist Manager Module
 * Handles wishlist operations with localStorage persistence
 * @module WishlistManager
 */

const STORAGE_KEY = 'loomSaga_wishlist';

function normalizeProduct(product) {
  const parsedStockQuantity = Number(product?.stockQuantity);
  const inStock = product?.inStock !== false;
  const stockQuantity = Number.isFinite(parsedStockQuantity)
    ? parsedStockQuantity
    : (inStock ? 1 : 0);

  return {
    ...product,
    id: String(product.id),
    inStock,
    stockQuantity
  };
}

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
  // Dispatch custom event so the UI can sync automatically
  window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { items } }));
}

/**
 * Check if product is in wishlist
 * @param {string} productId - Product ID
 * @returns {boolean} True if in wishlist
 */
export function isInWishlist(productId) {
  return getItems().some(item => String(item.id) === String(productId));
}

/**
 * Toggle wishlist item
 * @param {Object} product - Product object
 * @returns {boolean} True if added, false if removed
 */
export function toggle(product) {
  const items = getItems();
  const normalizedProduct = normalizeProduct(product);
  const existingIndex = items.findIndex(item => String(item.id) === String(normalizedProduct.id));

  if (existingIndex > -1) {
    items.splice(existingIndex, 1);
    saveItems(items);
    showNotification(`${normalizedProduct.name} removed from wishlist`);
    return false;
  } else {
    items.push(normalizedProduct);
    saveItems(items);
    showNotification(`${normalizedProduct.name} added to wishlist`);
    return true;
  }
}

/**
 * Add item to wishlist
 * @param {Object} product - Product object
 */
export function addItem(product) {
  const normalizedProduct = normalizeProduct(product);
  if (!isInWishlist(normalizedProduct.id)) {
    const items = getItems();
    items.push(normalizedProduct);
    saveItems(items);
    showNotification(`${normalizedProduct.name} added to wishlist`);
  }
}

/**
 * Remove item from wishlist
 * @param {string} productId - Product ID
 */
export function removeItem(productId) {
  const items = getItems().filter(item => String(item.id) !== String(productId));
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
