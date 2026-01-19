/**
 * ProductRenderer - Dynamic Product Card Rendering
 * @description Renders product cards from JSON data into DOM containers
 * @version 1.0.0
 */

class ProductRenderer {
  /**
   * Render a single product card
   * @param {Object} product - Product data object
   * @param {Object} options - Rendering options
   * @param {boolean} [options.showWishlist=true] - Show wishlist button
   * @param {boolean} [options.lazy=true] - Use lazy loading for images
   * @returns {string} HTML string for product card
   */
  static renderCard(product, options = {}) {
    const { showWishlist = true, lazy = true } = options;
    
    const imageUrl = product.images?.placeholder || product.images?.primary || 'https://placehold.co/400x500/e0e0e0/666?text=No+Image';
    const loadingAttr = lazy ? 'loading="lazy"' : 'loading="eager"';

    return `
      <article class="product-card" 
        data-product-id="${product.id}" 
        data-product-name="${this.escapeHtml(product.name)}" 
        data-product-price="${product.price}" 
        data-product-image="${imageUrl}">
        <a href="product-detail.html?id=${product.id}" class="product-card-link">
          <div class="product-card-image">
            <img src="${imageUrl}" alt="${this.escapeHtml(product.name)}" ${loadingAttr}>
            ${showWishlist ? this.renderWishlistButton() : ''}
          </div>
          <div class="product-card-info">
            <h2 class="product-card-name">${this.escapeHtml(product.name)}</h2>
            <p class="product-card-price">${this.formatPrice(product.price)}</p>
          </div>
        </a>
      </article>
    `;
  }

  /**
   * Render wishlist button
   * @private
   */
  static renderWishlistButton() {
    return `
      <button class="product-wishlist-btn" aria-label="Add to Wishlist">
        <img src="assets/icons/heart-outline.png" alt="" class="heart-outline">
        <img src="assets/icons/heart-filled.png" alt="" class="heart-filled">
      </button>
    `;
  }

  /**
   * Render multiple product cards into a container
   * @param {Array} products - Array of product objects
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Rendering options
   * @param {boolean} [options.append=false] - Append instead of replace
   * @param {boolean} [options.animate=true] - Add stagger animation class
   * @param {string} [options.emptyMessage] - Message when no products
   */
  static renderGrid(products, container, options = {}) {
    const { append = false, animate = true, emptyMessage = 'No products found.' } = options;

    // Get container element
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!containerEl) {
      console.error('ProductRenderer: Container not found');
      return;
    }

    // Handle empty state
    if (!products || products.length === 0) {
      containerEl.innerHTML = `
        <div class="products-empty-state">
          <p>${emptyMessage}</p>
        </div>
      `;
      return;
    }

    // Generate HTML
    const html = products.map(p => this.renderCard(p)).join('');

    // Update container
    if (append) {
      containerEl.insertAdjacentHTML('beforeend', html);
    } else {
      containerEl.innerHTML = html;
    }

    // Add animation class
    if (animate) {
      containerEl.classList.add('product-grid-animated');
    }

    // Re-initialize wishlist buttons
    this.initializeWishlistButtons(containerEl);
  }

  /**
   * Render a horizontal product card (for search results)
   * @param {Object} product - Product data
   * @returns {string} HTML string
   */
  static renderHorizontalCard(product) {
    const imageUrl = product.images?.thumbnail || product.images?.placeholder || product.images?.primary;

    return `
      <a href="product-detail.html?id=${product.id}" class="search-product-card">
        <div class="search-product-image">
          <img src="${imageUrl}" alt="${this.escapeHtml(product.name)}" loading="lazy">
        </div>
        <div class="search-product-info">
          <p class="search-product-name">${this.escapeHtml(product.name)}</p>
          <p class="search-product-price">${this.formatPrice(product.price)}</p>
        </div>
      </a>
    `;
  }

  /**
   * Render search results (suggestions + products)
   * @param {Object} results - Search results
   * @param {Array} results.products - Matching products
   * @param {Array} results.categories - Matching categories
   * @param {HTMLElement|string} suggestionsContainer - Suggestions list
   * @param {HTMLElement|string} productsContainer - Products list
   */
  static renderSearchResults(results, suggestionsContainer, productsContainer) {
    const suggestionsEl = typeof suggestionsContainer === 'string'
      ? document.querySelector(suggestionsContainer)
      : suggestionsContainer;

    const productsEl = typeof productsContainer === 'string'
      ? document.querySelector(productsContainer)
      : productsContainer;

    // Render category suggestions
    if (suggestionsEl && results.categories) {
      suggestionsEl.innerHTML = results.categories
        .slice(0, 5)
        .map(cat => `
          <li>
            <a href="${cat.slug}.html" class="search-suggestion-link">
              ${this.escapeHtml(cat.name)}
            </a>
          </li>
        `)
        .join('');
    }

    // Render product results
    if (productsEl && results.products) {
      productsEl.innerHTML = results.products
        .slice(0, 4)
        .map(p => this.renderHorizontalCard(p))
        .join('');
    }
  }

  /**
   * Render cart drawer item
   * @param {Object} item - Cart item (product + quantity)
   * @returns {string} HTML string
   */
  static renderCartItem(item) {
    const imageUrl = item.image || 'https://placehold.co/80x100/e0e0e0/666?text=No+Image';
    const total = item.price * item.quantity;

    return `
      <div class="cart-drawer-item" data-product-id="${item.id}">
        <div class="cart-item-image">
          <img src="${imageUrl}" alt="${this.escapeHtml(item.name)}">
        </div>
        <div class="cart-item-details">
          <p class="cart-item-name">${this.escapeHtml(item.name)}</p>
          <div class="cart-item-quantity">
            <button class="qty-btn qty-minus" data-action="decrease">-</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn qty-plus" data-action="increase">+</button>
          </div>
        </div>
        <div class="cart-item-price">
          <p>${this.formatPrice(total)}</p>
          <button class="cart-item-remove" data-action="remove" aria-label="Remove item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render filter options
   * @param {Object} filters - Filter data from ProductService
   * @param {Object} activeFilters - Currently active filters
   * @returns {string} HTML for filter panel
   */
  static renderFilters(filters, activeFilters = {}) {
    let html = '';

    // Color filters
    if (filters.color && filters.color.length > 0) {
      html += `
        <div class="filter-group">
          <h4 class="filter-group-title">Color</h4>
          <div class="filter-options">
            ${filters.color.map(c => `
              <label class="filter-checkbox">
                <input type="checkbox" name="color" value="${c.id}" 
                  ${activeFilters.colors?.includes(c.id) ? 'checked' : ''}>
                <span class="color-swatch-small" style="background-color: ${c.hex}"></span>
                ${c.name}
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Fabric filters
    if (filters.fabric && filters.fabric.length > 0) {
      html += `
        <div class="filter-group">
          <h4 class="filter-group-title">Fabric</h4>
          <div class="filter-options">
            ${filters.fabric.map(f => `
              <label class="filter-checkbox">
                <input type="checkbox" name="fabric" value="${f.id}"
                  ${activeFilters.fabrics?.includes(f.id) ? 'checked' : ''}>
                ${f.name}
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Occasion filters
    if (filters.occasion && filters.occasion.length > 0) {
      html += `
        <div class="filter-group">
          <h4 class="filter-group-title">Occasion</h4>
          <div class="filter-options">
            ${filters.occasion.map(o => `
              <label class="filter-checkbox">
                <input type="checkbox" name="occasion" value="${o.id}"
                  ${activeFilters.occasions?.includes(o.id) ? 'checked' : ''}>
                ${o.name}
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Price range filters
    if (filters.priceRange && filters.priceRange.length > 0) {
      html += `
        <div class="filter-group">
          <h4 class="filter-group-title">Price Range</h4>
          <div class="filter-options">
            ${filters.priceRange.map(p => `
              <label class="filter-checkbox">
                <input type="checkbox" name="price" value="${p.id}"
                  ${activeFilters.priceRangeId === p.id ? 'checked' : ''}>
                ${p.name}
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    return html;
  }

  /**
   * Initialize wishlist button click handlers
   * @private
   */
  static initializeWishlistButtons(container) {
    const buttons = container.querySelectorAll('.product-wishlist-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const card = btn.closest('.product-card');
        if (!card) return;

        const productData = {
          id: card.dataset.productId,
          name: card.dataset.productName,
          price: parseFloat(card.dataset.productPrice),
          image: card.dataset.productImage
        };

        // Use WishlistManager if available
        if (window.WishlistManager) {
          const isInWishlist = window.WishlistManager.isInWishlist(productData.id);
          if (isInWishlist) {
            window.WishlistManager.remove(productData.id);
            btn.classList.remove('active');
          } else {
            window.WishlistManager.add(productData);
            btn.classList.add('active');
          }
        }
      });
    });
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   */
  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format price for display
   * @private
   */
  static formatPrice(price) {
    return `Rs.${price.toLocaleString('en-IN')}/-`;
  }
}

// Export for ES Modules
export default ProductRenderer;

// Expose globally
if (typeof window !== 'undefined') {
  window.ProductRenderer = ProductRenderer;
}
