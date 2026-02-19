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
 * Automatically renders WooCommerce products on the dynamic category.html
 * template. Reads the category slug from:
 *   1. URL path  → /category/<slug>
 *   2. Query param → ?category=<slug>
 *   3. data-category attribute (legacy fallback)
 */

/** Slug → human-readable display name map */
const CATEGORY_DISPLAY_NAMES = {
  'vishnupuri-silk': 'Vishnupuri Silk Sarees',
  'muslin-sarees': 'Muslin Sarees',
  'silk-sarees': 'Silk Sarees',
  'modal-silk': 'Modal Silk Sarees',
  'matka-jamdani': 'Matka Jamdani Sarees',
  'tussar-jamdani': 'Tussar Jamdani Sarees',
  'tussar-dhakai-jamdani': 'Tussar Dhakai Jamdani Sarees',
  'muslin-jamdani': 'Muslin Jamdani Sarees',
  'tissue-matka-jamdani': 'Tissue Matka Jamdani Sarees',
  'silk-lenin': 'Silk Lenin Sarees',
  'all': 'All Collections',
};

/**
 * Extract category slug from URL query params or path.
 * Patterns matched:
 *   /category?type=vishnupuri-silk → "vishnupuri-silk"
 *   /category?category=vishnupuri-silk → "vishnupuri-silk"
 *   /category/vishnupuri-silk → "vishnupuri-silk" (path fallback)
 */
function getCategorySlugFromUrl() {
  const params = new URLSearchParams(window.location.search);

  // 1. Try ?type= query param (primary link format)
  if (params.get('type')) return params.get('type');

  // 2. Try ?category= query param (alt format)
  if (params.get('category')) return params.get('category');

  // 3. Try clean path: /category/<slug> (Vercel rewrite fallback)
  const pathMatch = window.location.pathname.match(/\/category\/([^/]+)/);
  if (pathMatch) return pathMatch[1];

  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const productsPage = document.querySelector('.products-page');
  if (!productsPage) return;

  // Read category slug: URL → data-attribute fallback
  const categorySlug = getCategorySlugFromUrl() || productsPage.dataset.category;
  if (!categorySlug) {
    console.warn('Category page detected but no category slug found in URL or data attribute');
    return;
  }

  // Dynamically update page title & heading
  const displayName = CATEGORY_DISPLAY_NAMES[categorySlug] ||
    categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const titleTag = document.getElementById('pageTitleTag');
  if (titleTag) titleTag.textContent = `${displayName} | Loom Saga`;

  const heading = document.getElementById('categoryTitle');
  if (heading) heading.textContent = displayName.toUpperCase();

  // Wait for ProductService to initialize
  await ProductService.init();

  // Fetch products for this category
  const products = ProductService.getProductsByCategory(categorySlug);
  console.log(`Category page (${categorySlug}): ${products.length} products found`);

  // Find the products grid and clear hardcoded content
  const grid = document.getElementById('categoryProductsGrid') ||
    document.querySelector('.products-grid');
  if (!grid) {
    console.warn('Products grid not found on page');
    return;
  }

  // Clear existing hardcoded cards
  grid.innerHTML = '';

  // Render products dynamically
  ProductRenderer.renderGrid(products, grid);

  // If no products found, show an elegant empty state
  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:5rem 2rem;">
        <p style="font-family:var(--font-heading); font-size:1.4rem; color:#333; letter-spacing:0.12em; margin-bottom:0.8rem;">
          COMING SOON
        </p>
        <p style="font-family:var(--font-body,Georgia,serif); font-size:0.95rem; color:#888; line-height:1.7; max-width:420px; margin:0 auto;">
          Our artisans are weaving something extraordinary for this collection. Stay tuned for timeless pieces crafted with love.
        </p>
      </div>
    `;
  }
});

