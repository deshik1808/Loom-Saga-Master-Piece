/**
 * ProductRenderer - Dynamic Product Card Rendering
 * @description Renders product cards from WooCommerce-sourced data into DOM
 * @version 2.0.0
 */

class ProductRenderer {
  /**
   * Get an optimized image URL using Statically.io for remote WordPress images
   * @param {string} url - Original image URL
   * @param {number} width - Target width
   * @param {number} quality - Image quality (1-100)
   * @returns {string} Optimized URL
   */
  static getOptimizedImage(url, width = 800, quality = 75) {
    if (!url) return 'https://placehold.co/800x1000/e0e0e0/666?text=No+Image';

    // 1. Handle placeholders
    if (url.includes('placehold.co')) return url;

    // 2. Detect Remote WordPress URLs (the source of the slowness)
    const isRemote = url.startsWith('http') && !url.includes(window.location.hostname);

    if (isRemote) {
      // DISABLED: Statically.io proxy causes ERR_NAME_NOT_RESOLVED
      // Subdomain 'p.statically.io' is invalid. Use 'cdn.statically.io' if needed in future.
      // For now, WordPress images are accessible and optimized enough.
      return url;
    }

    // 3. Local images - return as is
    return url;
  }

  /**
   * Render a single product card.
   * Shows "Out of Stock" badge when product is not in stock.
   * @param {Object} product - Normalised product data object
   * @param {Object} options - Rendering options
   * @returns {string} HTML string for product card
   */
  static renderCard(product, options = {}) {
    const { showWishlist = true, lazy = true } = options;

    const primaryUrl = product.images?.primary || product.primaryImage || product.images?.placeholder;
    const imageUrl = this.getOptimizedImage(primaryUrl, 600);
    const loadingAttr = lazy ? 'loading="lazy"' : 'loading="eager"';
    const isOutOfStock = product.inStock === false;
    const regularPrice = Number(product.regularPrice) || 0;
    const salePrice = Number(product.salePrice) || 0;
    const hasSale = salePrice > 0 && regularPrice > salePrice;
    const currentPrice = hasSale ? salePrice : (Number(product.price) || 0);

    return `
      <article class="product-card${isOutOfStock ? ' product-card--out-of-stock' : ''}" 
        data-product-id="${product.id}" 
        data-product-name="${this.escapeHtml(product.name)}" 
        data-product-price="${currentPrice}" 
        data-product-regular-price="${regularPrice}"
        data-product-sale-price="${salePrice}"
        data-product-image="${imageUrl}"
        data-stock-quantity="${product.stockQuantity ?? ''}"
        data-in-stock="${product.inStock !== false}">
        <a href="product-detail.html?id=${product.id}" class="product-card-link">
          <div class="product-card-image luxury-shimmer">
            <img src="${imageUrl}" 
                 alt="${this.escapeHtml(product.name)}" 
                 ${loadingAttr}
                 onload="this.parentElement.classList.remove('luxury-shimmer')">
            ${isOutOfStock ? '<span class="product-badge product-badge--oos">Out of Stock</span>' : ''}
            ${hasSale ? '<span class="product-badge product-badge--sale">Sale</span>' : ''}
            ${showWishlist ? this.renderWishlistButton() : ''}
          </div>
          <div class="product-card-info">
            <h2 class="product-card-name">${this.escapeHtml(product.name)}</h2>
            <p class="product-card-price">
              ${hasSale ? `<span class="product-card-price-regular">${this.formatPrice(regularPrice)}</span>` : ''}
              <span class="product-card-price-current${hasSale ? ' product-card-price-current--sale' : ''}">${this.formatPrice(currentPrice)}</span>
            </p>
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
   */
  static renderGrid(products, container, options = {}) {
    const { append = false, animate = true, emptyMessage = 'No products found.' } = options;

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

    if (append) {
      containerEl.insertAdjacentHTML('beforeend', html);
    } else {
      containerEl.innerHTML = html;
    }

    if (animate) {
      containerEl.classList.add('product-grid-animated');
    }

    // Re-initialize wishlist buttons
    this.initializeWishlistButtons(containerEl);
  }

  /**
   * Render a horizontal product card (for search results)
   */
  static renderHorizontalCard(product) {
    const imageUrl = product.images?.thumbnail || product.images?.placeholder || product.images?.primary || product.primaryImage;
    const regularPrice = Number(product.regularPrice) || 0;
    const salePrice = Number(product.salePrice) || 0;
    const hasSale = salePrice > 0 && regularPrice > salePrice;
    const currentPrice = hasSale ? salePrice : (Number(product.price) || 0);

    return `
      <a href="product-detail.html?id=${product.id}" class="search-product-card">
        <img src="${imageUrl}" alt="${this.escapeHtml(product.name)}" class="search-product-card__image" loading="lazy">
        <div class="search-product-card__info">
          <p class="search-product-card__name">${this.escapeHtml(product.name)}</p>
          <p class="search-product-card__price">
            ${hasSale ? `<span class="search-product-card__price-regular">${this.formatPrice(regularPrice)}</span>` : ''}
            <span class="search-product-card__price-current${hasSale ? ' search-product-card__price-current--sale' : ''}">${this.formatPrice(currentPrice)}</span>
          </p>
        </div>
      </a>
    `;
  }

  /**
   * Render search results
   */
  static renderSearchResults(results, suggestionsContainer, productsContainer) {
    const suggestionsEl = typeof suggestionsContainer === 'string'
      ? document.querySelector(suggestionsContainer)
      : suggestionsContainer;

    const productsEl = typeof productsContainer === 'string'
      ? document.querySelector(productsContainer)
      : productsContainer;

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

    if (productsEl && results.products) {
      productsEl.innerHTML = results.products
        .slice(0, 4)
        .map(p => this.renderHorizontalCard(p))
        .join('');
    }
  }

  /**
   * Render cart drawer item
   */
  static renderCartItem(item) {
    const rawImage = item.image || 'https://placehold.co/80x100/e0e0e0/666?text=No+Image';
    const imageUrl = this.getOptimizedImage(rawImage, 200);
    const total = item.price * item.quantity;
    const maxStock = item.stockQuantity ?? null;
    const atMax = maxStock !== null && item.quantity >= maxStock;

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
            <button class="qty-btn qty-plus" data-action="increase"${atMax ? ' disabled title="Stock limit reached"' : ''}>+</button>
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
          regularPrice: parseFloat(card.dataset.productRegularPrice) || 0,
          salePrice: parseFloat(card.dataset.productSalePrice) || 0,
          image: card.dataset.productImage
        };

        // Use WishlistManager if available
        if (window.WishlistManager) {
          // Module WishlistManager uses toggle(), legacy uses toggleItem()
          const toggleFn = window.WishlistManager.toggle || window.WishlistManager.toggleItem;
          if (toggleFn) {
            const isAdded = toggleFn.call(window.WishlistManager, productData);
            if (isAdded) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
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
