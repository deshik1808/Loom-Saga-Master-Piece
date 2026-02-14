/**
 * ProductService - Data Access Layer for Loom Saga Products
 * @description Provides methods to fetch, filter, and search products.
 *   Primary source: WooCommerce via /api/products
 *   Fallback: local /data/products.json
 * @version 2.0.0
 */

class ProductService {
  constructor() {
    this.products = [];
    this.categories = [];
    this.collections = [];
    this.filters = {};
    this.isLoaded = false;
    this.loadPromise = null;
    this.dataSource = 'none'; // 'api' | 'local' | 'none'
  }

  /**
   * Initialize the service by loading all data
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = Promise.all([
      this.loadProducts(),
      this.loadCategories(),
      this.loadCollections()
    ]).then(() => {
      this.isLoaded = true;
      console.log(`ProductService: ${this.products.length} products loaded from ${this.dataSource}`);
    });

    return this.loadPromise;
  }

  /**
   * Load products from WordPress via Vercel serverless function
   * Falls back to local JSON if API fails
   * @private
   */
  async loadProducts() {
    try {
      // Fetch from Vercel Serverless Function proxying WooCommerce
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const data = await response.json();
      const apiProducts = data.products || [];

      if (apiProducts.length > 0) {
        // Normalise API products so the rest of the code can use the same shape
        this.products = apiProducts.map(p => this._normalizeApiProduct(p));
        this.dataSource = 'api';
        return;
      }

      console.warn('ProductService: WooCommerce returned 0 products, falling back to local JSON');
    } catch (error) {
      console.warn('ProductService: API failed, falling back to local JSON', error.message);
    }

    // Fallback to local JSON
    try {
      const response = await fetch('/data/products.json');
      const data = await response.json();
      this.products = (data.products || []).map(p => this._normalizeLocalProduct(p));
      this.dataSource = 'local';
    } catch (localError) {
      console.error('ProductService: Local fallback also failed', localError);
      this.products = [];
      this.dataSource = 'none';
    }
  }

  /**
   * Normalise a product from the WooCommerce API proxy
   * so the rest of our code has a single consistent shape.
   * @private
   */
  _normalizeApiProduct(p) {
    return {
      // ── Identity ──
      id: String(p.id),
      sku: p.sku || '',
      slug: p.slug || '',
      name: p.name || '',

      // ── Pricing ──
      price: parseFloat(p.price) || 0,
      regularPrice: parseFloat(p.regularPrice) || 0,
      salePrice: parseFloat(p.salePrice) || 0,

      // ── Text ──
      description: p.description || '',
      shortDescription: p.shortDescription || '',

      // ── Media ──
      images: {
        primary: p.primaryImage || '',
        gallery: p.images || [],
        placeholder: p.primaryImage || 'https://placehold.co/400x500/e0e0e0/666?text=No+Image'
      },

      // ── Taxonomy ──
      category: p.category || 'uncategorized',      // primary category slug
      categoryName: p.categoryName || 'Uncategorized',
      categories: p.categories || [],                  // [{name,slug}, …]
      tags: p.tags || [],

      // ── Stock ──
      inStock: p.inStock !== false,
      stockQuantity: p.stockQuantity ?? null,           // null = unlimited
      manageStock: p.manageStock || false,

      // ── Flags ──
      featured: p.featured || false,
      newArrival: p.newArrival || false,

      // ── Attributes (for filters) ──
      attributes: {
        color: typeof p.attributes?.color === 'string'
          ? { name: p.attributes.color, hex: null }
          : (p.attributes?.color || null),
        fabric: p.attributes?.fabric || null,
        occasion: p.attributes?.occasion || [],
        raw: p.attributes?.raw || []
      },

      // ── Checkout ──
      checkoutUrl: p.checkoutUrl || ''
    };
  }

  /**
   * Normalise a product from data/products.json
   * @private
   */
  _normalizeLocalProduct(p) {
    return {
      id: String(p.id),
      sku: p.sku || '',
      slug: p.slug || '',
      name: p.name || '',
      price: p.price || 0,
      regularPrice: p.compareAtPrice || 0,
      salePrice: 0,
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      images: {
        primary: p.images?.primary || '',
        gallery: p.images?.gallery || [],
        placeholder: p.images?.placeholder || ''
      },
      category: p.category || 'uncategorized',
      categoryName: '',
      categories: (p.collections || []).map(s => ({ slug: s, name: s })),
      tags: p.tags || [],
      inStock: p.inStock !== false,
      stockQuantity: p.quantity ?? null,
      manageStock: p.quantity != null,
      featured: p.featured || false,
      newArrival: p.newArrival || false,
      attributes: p.attributes || {},
      checkoutUrl: ''
    };
  }

  /**
   * Load categories and filters from JSON
   * @private
   */
  async loadCategories() {
    try {
      const response = await fetch('/data/categories.json');
      const data = await response.json();
      this.categories = data.categories || [];
      this.filters = data.filters || {};
    } catch (error) {
      console.error('ProductService: Failed to load categories', error);
      this.categories = [];
      this.filters = {};
    }
  }

  /**
   * Load collections from JSON
   * @private
   */
  async loadCollections() {
    try {
      const response = await fetch('/data/collections.json');
      const data = await response.json();
      this.collections = data.collections || [];
    } catch (error) {
      console.error('ProductService: Failed to load collections', error);
      this.collections = [];
    }
  }

  // ==================== PRODUCT METHODS ====================

  /** Get all products */
  getAllProducts() {
    return this.products;
  }

  /** Get a product by ID */
  getProductById(id) {
    return this.products.find(p => String(p.id) === String(id)) || null;
  }

  /** Get a product by slug */
  getProductBySlug(slug) {
    return this.products.find(p => p.slug === slug) || null;
  }

  /**
   * Get products by category slug.
   * Checks the primary category AND the full categories array so a product
   * assigned to multiple WooCommerce categories will appear on every page.
   */
  getProductsByCategory(categorySlug) {
    return this.products.filter(p =>
      p.category === categorySlug ||
      p.categories.some(c => c.slug === categorySlug)
    );
  }

  /** Get featured products */
  getFeaturedProducts(limit = 6) {
    return this.products.filter(p => p.featured).slice(0, limit);
  }

  /** Get new arrival products */
  getNewArrivals(limit = 8) {
    return this.products.filter(p => p.newArrival).slice(0, limit);
  }

  /** Get related products */
  getRelatedProducts(productId, limit = 4) {
    const product = this.getProductById(productId);
    if (!product) return [];

    // If the product has explicit relatedProducts, use those
    if (product.relatedProducts && product.relatedProducts.length > 0) {
      return product.relatedProducts
        .map(id => this.getProductById(id))
        .filter(p => p !== null)
        .slice(0, limit);
    }

    // Otherwise, return products from the same category (excluding self)
    return this.products
      .filter(p => p.id !== product.id && p.category === product.category)
      .slice(0, limit);
  }

  /**
   * Filter products based on criteria
   */
  filterProducts(filters = {}) {
    let results = [...this.products];

    // Filter by category (checks all assigned categories)
    if (filters.category) {
      results = results.filter(p =>
        p.category === filters.category ||
        p.categories.some(c => c.slug === filters.category)
      );
    }

    // Filter by subcategory
    if (filters.subcategory) {
      results = results.filter(p => p.subcategory === filters.subcategory);
    }

    // Filter by colors
    if (filters.colors && filters.colors.length > 0) {
      results = results.filter(p => {
        const productColor = (typeof p.attributes?.color === 'object')
          ? p.attributes?.color?.name?.toLowerCase()
          : (p.attributes?.color || '').toLowerCase();
        return filters.colors.some(c =>
          productColor?.includes(c.toLowerCase()) ||
          p.tags?.some(tag => tag.toLowerCase() === c.toLowerCase())
        );
      });
    }

    // Filter by fabrics
    if (filters.fabrics && filters.fabrics.length > 0) {
      results = results.filter(p => {
        const fabric = (typeof p.attributes?.fabric === 'string')
          ? p.attributes.fabric.toLowerCase()
          : '';
        return filters.fabrics.some(f => fabric.includes(f.toLowerCase()));
      });
    }

    // Filter by occasions
    if (filters.occasions && filters.occasions.length > 0) {
      results = results.filter(p => {
        const occasions = p.attributes?.occasion || [];
        return filters.occasions.some(o =>
          occasions.some(occ => occ.toLowerCase() === o.toLowerCase())
        );
      });
    }

    // Filter by price range
    if (filters.priceRange) {
      const { min = 0, max = Infinity } = filters.priceRange;
      results = results.filter(p => p.price >= min && p.price <= max);
    }

    // Filter by in-stock
    if (filters.inStock) {
      results = results.filter(p => p.inStock);
    }

    // Filter by collection
    if (filters.collection) {
      results = results.filter(p =>
        p.categories?.some(c => c.slug === filters.collection) ||
        p.collections?.includes(filters.collection)
      );
    }

    return results;
  }

  /**
   * Sort products
   */
  sortProducts(products, sortBy = 'newest') {
    const sorted = [...products];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-az':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-za':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'rating':
        return sorted.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
      default:
        return sorted;
    }
  }

  /**
   * Search products by query
   */
  searchProducts(query) {
    if (!query || query.trim().length < 2) return [];

    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return this.products.filter(product => {
      const colorName = typeof product.attributes?.color === 'object'
        ? product.attributes.color.name
        : product.attributes?.color;

      const searchableText = [
        product.name,
        product.shortDescription,
        product.description,
        product.category,
        product.categoryName,
        ...(product.tags || []),
        colorName,
        product.attributes?.fabric,
        ...(product.attributes?.occasion || [])
      ].filter(Boolean).join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // ==================== CATEGORY METHODS ====================

  getAllCategories() {
    return this.categories;
  }

  getCategoryById(id) {
    return this.categories.find(c => c.id === id) || null;
  }

  getCategoryBySlug(slug) {
    return this.categories.find(c => c.slug === slug) || null;
  }

  getFeaturedCategories() {
    return this.categories.filter(c => c.featured);
  }

  // ==================== COLLECTION METHODS ====================

  getAllCollections() {
    return this.collections;
  }

  getCollectionById(id) {
    return this.collections.find(c => c.id === id) || null;
  }

  getCollectionBySlug(slug) {
    return this.collections.find(c => c.slug === slug) || null;
  }

  getProductsInCollection(collectionId, limit = null) {
    const collection = this.getCollectionById(collectionId);
    if (!collection) return [];

    let products = (collection.productIds || [])
      .map(id => this.getProductById(id))
      .filter(p => p !== null);

    if (limit) {
      products = products.slice(0, limit);
    }

    return products;
  }

  getHomepageCollections() {
    return this.collections
      .filter(c => c.showOnHomepage)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // ==================== FILTER METHODS ====================

  getFilters() {
    return this.filters;
  }

  getFilterOptionsForCategory(categoryId) {
    const products = this.getProductsByCategory(categoryId);

    return {
      colors: this.getColorCounts(products),
      fabrics: this.getFabricCounts(products),
      occasions: this.getOccasionCounts(products),
      priceRanges: this.getPriceRangeCounts(products)
    };
  }

  /** @private */
  getColorCounts(products) {
    const counts = {};
    products.forEach(p => {
      const color = typeof p.attributes?.color === 'object'
        ? p.attributes.color.name
        : p.attributes?.color;
      if (color) {
        counts[color] = (counts[color] || 0) + 1;
      }
    });
    return counts;
  }

  /** @private */
  getFabricCounts(products) {
    const counts = {};
    products.forEach(p => {
      const fabric = p.attributes?.fabric;
      if (fabric) {
        counts[fabric] = (counts[fabric] || 0) + 1;
      }
    });
    return counts;
  }

  /** @private */
  getOccasionCounts(products) {
    const counts = {};
    products.forEach(p => {
      (p.attributes?.occasion || []).forEach(occ => {
        counts[occ] = (counts[occ] || 0) + 1;
      });
    });
    return counts;
  }

  /** @private */
  getPriceRangeCounts(products) {
    const ranges = this.filters.priceRange || [];
    const counts = {};

    ranges.forEach(range => {
      const min = range.min || 0;
      const max = range.max || Infinity;
      counts[range.id] = products.filter(p => p.price >= min && p.price <= max).length;
    });

    return counts;
  }

  // ==================== UTILITY METHODS ====================

  formatPrice(price) {
    return `₹${price.toLocaleString('en-IN')}`;
  }

  getProductCount() {
    return this.products.length;
  }

  parseUrlFilters(queryString) {
    const params = new URLSearchParams(queryString);
    const filters = {};

    if (params.has('category')) filters.category = params.get('category');
    if (params.has('subcategory')) filters.subcategory = params.get('subcategory');
    if (params.has('color')) filters.colors = params.getAll('color');
    if (params.has('fabric')) filters.fabrics = params.getAll('fabric');
    if (params.has('occasion')) filters.occasions = params.getAll('occasion');
    if (params.has('collection')) filters.collection = params.get('collection');

    if (params.has('minPrice') || params.has('maxPrice')) {
      filters.priceRange = {
        min: parseInt(params.get('minPrice')) || 0,
        max: parseInt(params.get('maxPrice')) || Infinity
      };
    }

    if (params.has('inStock')) filters.inStock = params.get('inStock') === 'true';

    return filters;
  }

  buildFilterUrl(filters) {
    const params = new URLSearchParams();

    if (filters.category) params.set('category', filters.category);
    if (filters.subcategory) params.set('subcategory', filters.subcategory);
    if (filters.colors) filters.colors.forEach(c => params.append('color', c));
    if (filters.fabrics) filters.fabrics.forEach(f => params.append('fabric', f));
    if (filters.occasions) filters.occasions.forEach(o => params.append('occasion', o));
    if (filters.collection) params.set('collection', filters.collection);
    if (filters.priceRange?.min) params.set('minPrice', filters.priceRange.min);
    if (filters.priceRange?.max && filters.priceRange.max !== Infinity) {
      params.set('maxPrice', filters.priceRange.max);
    }
    if (filters.inStock) params.set('inStock', 'true');

    return params.toString();
  }
}

// Create singleton instance
const productService = new ProductService();

// Export for ES Modules
export default productService;

// Also expose globally for non-module scripts
if (typeof window !== 'undefined') {
  window.ProductService = productService;
}
