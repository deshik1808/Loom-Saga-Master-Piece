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
 * PRODUCT DETAIL PAGE (PDP) DYNAMIC RENDERING
 * ========================================================================
 * Automatically renders product data on product-detail.html.
 * Reads the product ID from URL query params: ?id=<productId>
 * Falls back to ?slug=<slug> if no ID is provided.
 *
 * Data sources (in priority order):
 *   1. ProductService (already loaded product list)
 *   2. Direct API call to /api/product?id=<id>
 *   3. Local fallback data/products.json
 */

/**
 * COLOR_MAP: Curated color-name → CSS-value registry.
 *
 * Covers:
 *   • CSS named colors that are common in fashion (already work natively,
 *     included here for explicitness and case-insensitivity)
 *   • Fashion/saree-specific names that WooCommerce merchants use
 *
 * Extend this list whenever a new color name appears in WooCommerce.
 * Keys MUST be lowercase; values can be any valid CSS color.
 */
const COLOR_MAP = {
  // ── Whites & Neutrals ──
  'white': '#ffffff',
  'off white': '#f5f5f0',
  'off-white': '#f5f5f0',
  'cream': '#fffdd0',
  'ivory': '#fffff0',
  'beige': '#f5f5dc',
  'ecru': '#c2b280',
  'champagne': '#f7e7ce',
  'pearl': '#f0ead6',
  'eggshell': '#f0ead6',
  'linen': '#faf0e6',
  // ── Blacks & Greys ──
  'black': '#0a0a0a',
  'charcoal': '#36454f',
  'graphite': '#474747',
  'slate': '#708090',
  'ash': '#b2beb5',
  'silver': '#c0c0c0',
  'grey': '#808080',
  'gray': '#808080',
  'light grey': '#d3d3d3',
  'dark grey': '#a9a9a9',
  // ── Browns & Earthy ──
  'brown': '#8b4513',
  'chocolate': '#7b3f00',
  'coffee': '#6f4e37',
  'caramel': '#c68642',
  'tan': '#d2b48c',
  'sand': '#c2b280',
  'khaki': '#c3b091',
  'copper': '#b87333',
  'bronze': '#cd7f32',
  'rust': '#b7410e',
  'terracotta': '#c17b50',
  'ochre': '#cc7722',
  'sienna': '#a0522d',
  // ── Reds & Pinks ──
  'red': '#dc143c',
  'cherry': '#de3163',
  'crimson': '#dc143c',
  'scarlet': '#ff2400',
  'maroon': '#800000',
  'burgundy': '#800020',
  'wine': '#722f37',
  'brick red': '#cb4154',
  'brick': '#cb4154',
  'coral': '#ff6b6b',
  'salmon': '#fa8072',
  'blush': '#ffb6c1',
  'dusty rose': '#dcae96',
  'dusty pink': '#dcae96',
  'rose': '#ff007f',
  'hot pink': '#ff69b4',
  'fuchsia': '#ff00ff',
  'magenta': '#ff00ff',
  'pink': '#ffb6c1',
  'baby pink': '#f4c2c2',
  'bubblegum pink': '#ff91af',
  'watermelon': '#fc6c85',
  // ── Oranges & Yellows ──
  'orange': '#ff8c00',
  'burnt orange': '#cc5500',
  'amber': '#ffbf00',
  'mustard': '#ffdb58',
  'mustard yellow': '#e1ad01',
  'golden yellow': '#ffc200',
  'yellow': '#ffd700',
  'sunshine': '#fffd37',
  'lemon': '#fff44f',
  'saffron': '#f4820a',
  'turmeric': '#e3a018',
  'mango': '#fdbe02',
  'peach': '#ffcba4',
  // ── Greens ──
  'green': '#228b22',
  'lime': '#32cd32',
  'lime green': '#9acd32',
  'olive': '#808000',
  'olive green': '#6b8e23',
  'forest green': '#228b22',
  'bottle green': '#006a4e',
  'emerald': '#50c878',
  'jade': '#00a86b',
  'mint': '#98ff98',
  'mint green': '#98ff98',
  'sage': '#bcb88a',
  'sage green': '#b2ac88',
  'teal': '#008080',
  'sea green': '#2e8b57',
  'pine green': '#01796f',
  'pista': '#93c572',
  'pista green': '#93c572',
  'mehendi': '#56711e',
  'mehendi green': '#56711e',
  // ── Blues ──
  'blue': '#0047ab',
  'navy': '#000080',
  'navy blue': '#000080',
  'royal blue': '#4169e1',
  'cobalt': '#0047ab',
  'cobalt blue': '#0047ab',
  'cerulean': '#007ba7',
  'steel blue': '#4682b4',
  'powder blue': '#b0e0e6',
  'sky blue': '#87ceeb',
  'baby blue': '#89cff0',
  'turquoise': '#40e0d0',
  'aqua': '#00ffff',
  'aqua blue': '#00b5e2',
  'indigo': '#4b0082',
  'peacock blue': '#005f6a',
  'peacock': '#005f6a',
  // ── Purples & Violets ──
  'purple': '#6a0dad',
  'violet': '#ee82ee',
  'lavender': '#e6e6fa',
  'mauve': '#e0b0ff',
  'plum': '#8e4585',
  'lilac': '#c8a2c8',
  'grape': '#6f2da8',
  'mulberry': '#c54b8c',
  'orchid': '#da70d6',
  'amethyst': '#9966cc',
  'periwinkle': '#ccccff',
  'wisteria': '#c9a0dc',
  // ── Indian Fashion Specifics ──
  'gold': '#ffd700',
  'golden': '#ffd700',
  'zari gold': '#cfb53b',
  'antique gold': '#cfb53b',
  'rose gold': '#b76e79',
  'rose-gold': '#b76e79',
  'kundan': '#e8c84f',
  'dark blue': '#00008b',
  'dark green': '#006400',
  'dark red': '#8b0000',
  'light blue': '#add8e6',
  'light green': '#90ee90',
  'light yellow': '#ffffe0',
  'light pink': '#ffb6c1',
  'pastel blue': '#b0d9f5',
  'pastel green': '#b2ffb2',
  'pastel pink': '#ffd1dc',
  'pastel yellow': '#fdfd96',
  'dark purple': '#301934',
  'deep purple': '#3d0a5c',
  // ── Multi / Special ──
  // These cannot be a single color; use a diagonal gradient
  'multi': null,
  'multi color': null,
  'multi-color': null,
  'multicolor': null,
  'multicolour': null,
  'multi colour': null,
};

/**
 * Resolve a merchant-entered color name to a CSS background value.
 *
 * Priority:
 *   1. COLOR_MAP match (case-insensitive)
 *   2. Inline hex/rgb value (already a valid CSS color)
 *   3. Native CSS named color validation via a hidden element trick
 *   4. Striped gradient fallback (visually signals "multi" or unknown)
 *
 * @param {string} name - Raw color name from WooCommerce
 * @returns {{ bg: string, isMulti: boolean }} CSS background value + multi flag
 */
function resolveSwatchColor(name) {
  if (!name) return { bg: '#cccccc', isMulti: false };

  const key = name.trim().toLowerCase();

  // 1. COLOR_MAP lookup
  if (Object.prototype.hasOwnProperty.call(COLOR_MAP, key)) {
    const mapped = COLOR_MAP[key];
    if (mapped === null) {
      // Null explicitly means multi-color
      return {
        bg: 'linear-gradient(135deg, #e74c3c 0%, #e74c3c 20%, #f39c12 20%, #f39c12 40%, #2ecc71 40%, #2ecc71 60%, #3498db 60%, #3498db 80%, #9b59b6 80%, #9b59b6 100%)',
        isMulti: true
      };
    }
    return { bg: mapped, isMulti: false };
  }

  // 2. Already a valid CSS value (hex, rgb, hsl)
  if (/^#[0-9a-f]{3,8}$/i.test(key) || /^(rgb|hsl)a?\(/.test(key)) {
    return { bg: name, isMulti: false };
  }

  // 3. Native CSS named color: test by assigning to a temp element
  //    If the browser can resolve it, getComputedStyle returns a non-empty value
  const testEl = document.createElement('div');
  testEl.style.display = 'none';
  testEl.style.color = name;
  document.body.appendChild(testEl);
  const computed = window.getComputedStyle(testEl).color;
  document.body.removeChild(testEl);
  // 'rgb(0, 0, 0)' means it resolved to black (which could mean it worked
  // for 'black' but also means it failed for unknown names since the default
  // is transparent, not black). Check for non-default non-transparent value:
  if (computed && computed !== 'rgba(0, 0, 0, 0)' && computed !== '') {
    return { bg: name, isMulti: false };
  }

  // 4. Fallback: neutral grey diagonal stripe — signals "unknown" to developer
  //    Tooltip on the swatch still shows the name for the user
  return {
    bg: 'linear-gradient(135deg, #d0d0d0 25%, #f0f0f0 25%, #f0f0f0 50%, #d0d0d0 50%, #d0d0d0 75%, #f0f0f0 75%)',
    isMulti: false
  };
}

/**
 * Extract product images as a flat array from various data shapes.
 * @param {Object} product - Product data (API, local JSON, or normalised)
 * @returns {string[]} Array of image URLs
 */
function getProductImages(product) {
  const images = [];

  // Shape 1: normalised (ProductService) → images: { primary, gallery, placeholder }
  if (product.images && typeof product.images === 'object' && !Array.isArray(product.images)) {
    if (product.images.primary) images.push(product.images.primary);
    if (Array.isArray(product.images.gallery)) {
      product.images.gallery.forEach(url => {
        if (url && !images.includes(url)) images.push(url);
      });
    }
    if (images.length === 0 && product.images.placeholder) {
      images.push(product.images.placeholder);
    }
  }

  // Shape 2: direct API → images: ["url1", "url2", ...], primaryImage: "url"
  if (Array.isArray(product.images)) {
    product.images.forEach(url => {
      if (url && !images.includes(url)) images.push(url);
    });
  }
  if (product.primaryImage && !images.includes(product.primaryImage)) {
    images.unshift(product.primaryImage);
  }

  // Fallback: placeholder
  if (images.length === 0) {
    images.push('https://placehold.co/800x1000/e0e0e0/666?text=No+Image');
  }

  return images;
}

/**
 * Render product data into the PDP template DOM.
 * @param {Object} product - Normalised or API product object
 */
function renderPDP(product) {
  // ── Title ──
  const titleEl = document.getElementById('pdpTitle');
  if (titleEl) titleEl.textContent = product.name || 'Untitled Product';
  document.title = `${product.name || 'Product'} | Loom Saga`;

  // ── Price ──
  const priceEl = document.getElementById('pdpPrice');
  if (priceEl) {
    const price = Number(product.price) || 0;
    priceEl.textContent = `Rs.${price.toLocaleString('en-IN')}/-`;
  }

  // ── Images / Gallery ──
  const allImages = getProductImages(product);

  // Fill the 4 static placeholder slots (pdpImage0 – pdpImage3)
  for (let i = 0; i < 4; i++) {
    const imgEl = document.getElementById(`pdpImage${i}`);
    if (imgEl) {
      if (allImages[i]) {
        imgEl.src = allImages[i];
        imgEl.alt = `${product.name} - View ${i + 1}`;
        imgEl.parentElement.style.display = '';
      } else {
        // Hide unused slots
        imgEl.parentElement.style.display = 'none';
      }
    }
  }

  // Add extra images beyond the 4 static slots dynamically
  const galleryGrid = document.getElementById('pdpGalleryGrid');
  if (galleryGrid && allImages.length > 4) {
    for (let i = 4; i < allImages.length; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-image luxury-shimmer';
      wrapper.setAttribute('data-index', i);
      const img = document.createElement('img');
      img.src = allImages[i];
      img.alt = `${product.name} - View ${i + 1}`;
      img.loading = 'lazy';
      img.onload = function () {
        this.parentElement.classList.remove('luxury-shimmer');
        this.style.opacity = '1';
      };
      wrapper.appendChild(img);
      // Insert after the grid (as sibling of gallery-grid)
      galleryGrid.parentElement.appendChild(wrapper);
    }
  }

  // ── Product Info data attributes (for Cart / Wishlist) ──
  const productInfo = document.querySelector('.product-info');
  if (productInfo) {
    productInfo.setAttribute('data-product-id', product.id || '');
    productInfo.setAttribute('data-product-name', product.name || '');
    productInfo.setAttribute('data-product-price', product.price || '0');
    productInfo.setAttribute('data-product-image', allImages[0] || '');
    if (product.stockQuantity != null) {
      productInfo.setAttribute('data-stock-quantity', product.stockQuantity);
    }
    productInfo.setAttribute('data-in-stock', String(product.inStock === true));

    // Dynamic cart attributes: Color and Style
    const attrs = product.attributes || {};
    let productColor = 'Unknown';
    if (Array.isArray(attrs.color) && attrs.color.length > 0) {
      productColor = attrs.color[0];
    } else if (typeof attrs.color === 'string' && attrs.color) {
      productColor = attrs.color;
    }
    productInfo.setAttribute('data-product-color', productColor);

    // Convert slug to Title Case (e.g. 'silk-sarees' → 'Silk Sarees')
    const slugToTitle = (slug) => {
      if (!slug) return 'Unknown';
      return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };
    const rawStyle = product.categoryName && product.categoryName !== 'Uncategorized'
      ? product.categoryName
      : (Array.isArray(product.categories) && product.categories.length > 0
        ? (product.categories[0].name || product.categories[0].slug || 'Unknown')
        : 'Unknown');
    productInfo.setAttribute('data-product-style', slugToTitle(rawStyle));
  }

  // ── Add to Cart button ──
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.setAttribute('data-product-id', product.id || '');

    const purchasable = ProductRenderer.isPurchasable(product);
    if (!purchasable) {
      addToCartBtn.disabled = true;
      addToCartBtn.textContent = 'OUT OF STOCK';
      addToCartBtn.classList.add('product-add-btn--disabled');
    } else {
      addToCartBtn.disabled = false;
      addToCartBtn.textContent = 'ADD TO CART';
      addToCartBtn.classList.remove('product-add-btn--disabled');
    }
  }

  // ── Color Swatches ──
  const colorSection = document.querySelector('.product-color-section');
  if (colorSection) {
    const attrs = product.attributes || {};

    // Collect all color names from whichever data shape we have:
    //   Shape A (WooCommerce API): attrs.raw = [{ name: 'Color', options: ['Red','Blue'] }]
    //   Shape B (normalised):      attrs.color = 'Red' | { name: 'Red', hex: '#dc143c' }
    //   Shape C (array):           attrs.color = ['Red', 'Blue']
    let colorNames = [];

    const rawColors = attrs.raw
      ? attrs.raw.filter(a => a.name && a.name.toLowerCase() === 'color')
      : [];

    if (rawColors.length > 0 && Array.isArray(rawColors[0].options)) {
      colorNames = rawColors[0].options.filter(Boolean);
    } else if (attrs.color) {
      if (Array.isArray(attrs.color)) {
        colorNames = attrs.color.filter(Boolean);
      } else if (typeof attrs.color === 'object' && attrs.color.name) {
        // { name, hex } shape — use hex directly if provided
        colorNames = [attrs.color.hex ? `__hex__${attrs.color.hex}__${attrs.color.name}` : attrs.color.name];
      } else if (typeof attrs.color === 'string') {
        colorNames = [attrs.color];
      }
    }

    if (colorNames.length === 0) {
      colorSection.style.display = 'none';
    } else {
      const swatchContainer = colorSection.querySelector('.product-color-swatches');
      if (swatchContainer) {
        swatchContainer.innerHTML = '';
        colorNames.forEach((rawName, idx) => {
          // Handle the __hex__ encoding for pre-resolved hex values
          let displayName = rawName;
          let resolvedBg, isMulti;

          if (typeof rawName === 'string' && rawName.startsWith('__hex__')) {
            // Format: __hex__#rrggbb__Display Name
            const parts = rawName.replace('__hex__', '').split('__');
            resolvedBg = parts[0];
            displayName = parts[1] || parts[0];
            isMulti = false;
          } else {
            ({ bg: resolvedBg, isMulti } = resolveSwatchColor(displayName));
          }

          const btn = document.createElement('button');
          btn.className = 'color-swatch' + (idx === 0 ? ' active' : '');
          btn.setAttribute('aria-label', displayName);         // screen reader label
          btn.setAttribute('title', displayName);              // tooltip on hover
          btn.setAttribute('data-color', displayName.toLowerCase());

          if (isMulti) {
            // Multi-color: use CSS background (gradient set in resolveSwatchColor)
            btn.style.background = resolvedBg;
          } else if (resolvedBg.startsWith('linear-gradient')) {
            // Fallback striped gradient (unmapped name)
            btn.style.background = resolvedBg;
            btn.style.backgroundSize = '8px 8px';
          } else {
            btn.style.backgroundColor = resolvedBg;
          }

          swatchContainer.appendChild(btn);
        });
      }
      colorSection.style.display = '';
    }
  }

  // ── Accordion: Description & Fit ──
  const descAccordion = document.getElementById('pdpAccordionDescription');
  if (descAccordion) {
    const desc = product.description || product.shortDescription || '';
    if (desc) {
      // The description from WooCommerce is HTML, inject it directly
      descAccordion.innerHTML = desc;
    }
  }

  // ── Accordion: Materials ──
  const matAccordion = document.getElementById('pdpAccordionMaterials');
  if (matAccordion) {
    const acf = product.acf || {};
    const fabricComp = acf.fabricComposition ||
      product.attributes?.fabricComposition || '';
    const materialDetails = acf.materialDetails || '';

    if (fabricComp || materialDetails) {
      let html = '';
      if (fabricComp) html += `<p><strong>Fabric Composition:</strong> ${fabricComp}</p>`;
      if (materialDetails) html += materialDetails;
      matAccordion.innerHTML = html;
    }
    // If no data, leave existing placeholder content
  }

  // ── Accordion: Care Guide ──
  const careAccordion = document.getElementById('pdpAccordionCare');
  if (careAccordion) {
    const acf = product.acf || {};
    const careInstructions = acf.careInstructions || '';

    if (careInstructions) {
      careAccordion.innerHTML = careInstructions;
    }
    // If no data, leave existing placeholder content
  }

  // ── Accordion: Delivery ──
  const deliveryAccordion = document.getElementById('pdpAccordionDelivery');
  if (deliveryAccordion) {
    const acf = product.acf || {};
    const deliveryInfo = acf.deliveryInfo || '';

    if (deliveryInfo) {
      deliveryAccordion.innerHTML = deliveryInfo;
    }
    // If no data, leave existing placeholder content
  }

  console.log(`PDP rendered: ${product.name} (ID: ${product.id})`);
}

/**
 * Render "You May Also Like" section with related products.
 * @param {string} productId - Current product ID
 */
function renderRelatedProducts(productId) {
  const relatedGrid = document.querySelector('.product-related-grid');
  if (!relatedGrid) return;

  const relatedProducts = ProductService.getRelatedProducts(productId, 3);
  if (relatedProducts.length === 0) {
    // Hide the entire section if no related products
    const section = document.querySelector('.product-related');
    if (section) section.style.display = 'none';
    return;
  }

  // Clear hardcoded related products and render dynamic ones
  relatedGrid.innerHTML = '';
  ProductRenderer.renderGrid(relatedProducts, relatedGrid, { showWishlist: true });
}

/**
 * Show a graceful "Product not found" error state on the PDP.
 */
function renderPDPError() {
  const main = document.querySelector('.product-detail-page');
  if (!main) return;

  main.innerHTML = `
    <div class="container" style="text-align:center; padding:6rem 2rem;">
      <p style="font-family:var(--font-heading); font-size:1.6rem; color:#333; letter-spacing:0.12em; margin-bottom:1rem;">
        PRODUCT NOT FOUND
      </p>
      <p style="font-family:var(--font-body,Georgia,serif); font-size:0.95rem; color:#888; line-height:1.7; max-width:460px; margin:0 auto 2rem;">
        We couldn't find the product you're looking for. It may have been removed or the link may be incorrect.
      </p>
      <a href="/category?type=all"
         style="display:inline-block; padding:14px 40px; border:1px solid #2c2c2c; font-family:var(--font-body); font-size:11px; letter-spacing:2.5px; text-transform:uppercase; color:#2c2c2c; text-decoration:none; transition:all 0.3s ease;">
        EXPLORE COLLECTION
      </a>
    </div>
  `;
  document.title = 'Product Not Found | Loom Saga';
}

/**
 * PDP page initialisation handler
 */
document.addEventListener('DOMContentLoaded', async () => {
  const pdpPage = document.querySelector('.product-detail-page');
  if (!pdpPage) return; // Not on PDP – exit early

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const productSlug = params.get('slug');

  // No identifier at all → error
  if (!productId && !productSlug) {
    renderPDPError();
    return;
  }

  let product = null;

  try {
    // 1. Try ProductService (already loaded from init())
    await ProductService.init();

    if (productId) {
      product = ProductService.getProductById(productId);
    }
    if (!product && productSlug) {
      product = ProductService.getProductBySlug(productSlug);
    }

    // 2. If not found locally, try direct API call
    if (!product && productId) {
      try {
        const apiRes = await fetch(`/api/product?id=${encodeURIComponent(productId)}`);
        if (apiRes.ok) {
          const apiProduct = await apiRes.json();
          if (apiProduct && apiProduct.id) {
            product = apiProduct;
          }
        }
      } catch (apiErr) {
        console.warn('PDP: API fetch failed, will use fallback', apiErr);
      }
    }

    // 3. If still no product, show error
    if (!product) {
      renderPDPError();
      return;
    }

    // Render product data into DOM
    renderPDP(product);

    // Render related "You May Also Like" products
    renderRelatedProducts(product.id);

  } catch (error) {
    console.error('PDP: Failed to load product', error);
    renderPDPError();
  }
});

