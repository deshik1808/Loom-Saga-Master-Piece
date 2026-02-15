/**
 * Loom Saga - Main JavaScript Entry Point (ES Modules)
 * @description Handles interactive features for the e-commerce website
 * @version 2.0.0
 */

// Import modular components
import CartManager from './modules/CartManager.js';
import WishlistManager from './modules/WishlistManager.js';
import ScrollAnimations from './modules/ScrollAnimations.js';
import ProductService from './modules/ProductService.js';
import ProductRenderer from './modules/ProductRenderer.js';
import NewsletterManager from './modules/NewsletterManager.js';
import ContactFormManager from './modules/ContactFormManager.js';
import { AuthManager } from './modules/AuthManager.js';

// Export for global access (backward compatibility)
window.CartManager = CartManager;
window.WishlistManager = WishlistManager;
window.ProductService = ProductService;
window.ProductRenderer = ProductRenderer;
window.AuthManager = AuthManager;

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize scroll animations
  ScrollAnimations.init();

  // Initialize newsletter form
  NewsletterManager.init();

  // Initialize contact form (only runs on contact.html)
  ContactFormManager.init();

  // Update badges on page load
  CartManager.updateBadge();
  WishlistManager.updateBadge();

  // Initialize auth manager (updates header UI based on session)
  AuthManager.init();

  // Initialize product data service
  try {
    await ProductService.init();
    console.log(`Loom Saga: ${ProductService.getProductCount()} products loaded`);
  } catch (error) {
    console.warn('Loom Saga: Product data not available', error);
  }

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
 *   - ProductService.js    (Product data layer, filtering, search)
 *   - ProductRenderer.js   (Dynamic product card rendering)
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

/*
 * ========================================================================
 * CATEGORY PAGE DYNAMIC PRODUCT RENDERING
 * ========================================================================
 * Automatically renders WooCommerce products on category listing pages
 * (vishnupuri-silk.html, silk-sarees.html, etc.)
 */
document.addEventListener('DOMContentLoaded', async () => {
  const productsPage = document.querySelector('.products-page');
  if (!productsPage) return;

  // Read category slug from data attribute on main tag
  const categorySlug = productsPage.dataset.category;
  if (!categorySlug) {
    console.warn('Category page detected but no data-category attribute found');
    return;
  }

  // Wait for ProductService to initialize
  await ProductService.init();

  // Fetch products for this category
  const products = ProductService.getProductsByCategory(categorySlug);
  console.log(`Category page (${categorySlug}): ${products.length} products found`);

  // Find the products grid and clear hardcoded content
  const grid = document.querySelector('.products-grid');
  if (!grid) {
    console.warn('Products grid not found on page');
    return;
  }

  // Clear existing hardcoded cards
  grid.innerHTML = '';

  // Render products dynamically
  ProductRenderer.renderGrid(products, grid);

  // If no products found, show a message
  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:3rem 1rem;">
        <p style="font-family:var(--font-heading); font-size:1.2rem; color:#555;">
          No products found in this category
        </p>
      </div>
    `;
  }
});

