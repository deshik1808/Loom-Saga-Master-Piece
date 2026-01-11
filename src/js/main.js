/**
 * Loom Saga - Main JavaScript Entry Point (ES Modules)
 * @description Handles interactive features for the e-commerce website
 * @version 2.0.0
 */

// Import modular components
import CartManager from './modules/CartManager.js';
import WishlistManager from './modules/WishlistManager.js';
import ScrollAnimations from './modules/ScrollAnimations.js';

// Export for global access (backward compatibility)
window.CartManager = CartManager;
window.WishlistManager = WishlistManager;

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize scroll animations
  ScrollAnimations.init();
  
  // Update badges on page load
  CartManager.updateBadge();
  WishlistManager.updateBadge();
  
  console.log('Loom Saga: Modules initialized');
});

/*
 * ========================================================================
 * MODULARIZATION PROGRESS
 * ========================================================================
 * 
 * ✅ COMPLETED MODULES:
 *   - CartManager.js       (Cart operations with localStorage)
 *   - WishlistManager.js   (Wishlist operations with localStorage)
 *   - ScrollAnimations.js  (Intersection Observer, header scroll)
 *
 * ⏳ TODO (Future modularization):
 *   - SearchManager.js     (Search modal, live search)
 *   - MegaMenuController.js (Desktop mega menu hover)
 *   - MobileNav.js         (Hamburger menu, slide-out nav)
 *   - ProductGallery.js    (Product detail page gallery)
 *   - FormValidation.js    (Checkout, auth forms)
 *
 * The legacy js/main.js will be retained for components not yet migrated.
 * ========================================================================
 */
