/**
 * ProductService - Data Access Layer for Loom Saga Products
 * @description Provides methods to fetch, filter, and search products from JSON data.
 * @version 1.0.0
 */

class ProductService {
  constructor() {
    this.products = [];
    this.categories = [];
    this.collections = [];
    this.filters = {};
    this.isLoaded = false;
    this.loadPromise = null;
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
      console.log('ProductService: Data loaded successfully');
    });

    return this.loadPromise;
  }

  /**
   * Load products from JSON
   * @private
   */
  async loadProducts() {
    try {
      const response = await fetch('/data/products.json');
      const data = await response.json();
      this.products = data.products || [];
    } catch (error) {
      console.error('ProductService: Failed to load products', error);
      this.products = [];
    }
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

  /**
   * Get all products
   * @returns {Array} All products
   */
  getAllProducts() {
    return this.products;
  }

  /**
   * Get a product by ID
   * @param {string} id - Product ID
   * @returns {Object|null} Product or null if not found
   */
  getProductById(id) {
    return this.products.find(p => p.id === id) || null;
  }

  /**
   * Get a product by slug
   * @param {string} slug - Product slug
   * @returns {Object|null} Product or null if not found
   */
  getProductBySlug(slug) {
    return this.products.find(p => p.slug === slug) || null;
  }

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @returns {Array} Products in category
   */
  getProductsByCategory(categoryId) {
    return this.products.filter(p => p.category === categoryId);
  }

  /**
   * Get featured products
   * @param {number} limit - Maximum number of products to return
   * @returns {Array} Featured products
   */
  getFeaturedProducts(limit = 6) {
    return this.products.filter(p => p.featured).slice(0, limit);
  }

  /**
   * Get new arrival products
   * @param {number} limit - Maximum number of products to return
   * @returns {Array} New arrival products
   */
  getNewArrivals(limit = 8) {
    return this.products.filter(p => p.newArrival).slice(0, limit);
  }

  /**
   * Get related products
   * @param {string} productId - Current product ID
   * @param {number} limit - Maximum number of products to return
   * @returns {Array} Related products
   */
  getRelatedProducts(productId, limit = 4) {
    const product = this.getProductById(productId);
    if (!product || !product.relatedProducts) return [];

    return product.relatedProducts
      .map(id => this.getProductById(id))
      .filter(p => p !== null)
      .slice(0, limit);
  }

  /**
   * Filter products based on criteria
   * @param {Object} filters - Filter criteria
   * @param {string} [filters.category] - Category ID
   * @param {string[]} [filters.colors] - Array of color IDs
   * @param {string[]} [filters.fabrics] - Array of fabric IDs
   * @param {string[]} [filters.occasions] - Array of occasion IDs
   * @param {Object} [filters.priceRange] - Price range {min, max}
   * @param {boolean} [filters.inStock] - Only in-stock products
   * @returns {Array} Filtered products
   */
  filterProducts(filters = {}) {
    let results = [...this.products];

    // Filter by category
    if (filters.category) {
      results = results.filter(p => p.category === filters.category);
    }

    // Filter by subcategory
    if (filters.subcategory) {
      results = results.filter(p => p.subcategory === filters.subcategory);
    }

    // Filter by colors
    if (filters.colors && filters.colors.length > 0) {
      results = results.filter(p => {
        const productColor = p.attributes?.color?.name?.toLowerCase();
        return filters.colors.some(c => 
          productColor?.includes(c.toLowerCase()) ||
          p.tags?.some(tag => tag.toLowerCase() === c.toLowerCase())
        );
      });
    }

    // Filter by fabrics
    if (filters.fabrics && filters.fabrics.length > 0) {
      results = results.filter(p => {
        const fabric = p.attributes?.fabric?.toLowerCase() || '';
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
        p.collections?.includes(filters.collection)
      );
    }

    return results;
  }

  /**
   * Sort products
   * @param {Array} products - Products to sort
   * @param {string} sortBy - Sort criteria: 'newest', 'price-low', 'price-high', 'name-az', 'name-za', 'rating'
   * @returns {Array} Sorted products
   */
  sortProducts(products, sortBy = 'newest') {
    const sorted = [...products];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
   * @param {string} query - Search query
   * @returns {Array} Matching products
   */
  searchProducts(query) {
    if (!query || query.trim().length < 2) return [];

    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return this.products.filter(product => {
      const searchableText = [
        product.name,
        product.shortDescription,
        product.description,
        product.category,
        product.subcategory,
        ...(product.tags || []),
        product.attributes?.color?.name,
        product.attributes?.fabric,
        ...(product.attributes?.occasion || [])
      ].filter(Boolean).join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // ==================== CATEGORY METHODS ====================

  /**
   * Get all categories
   * @returns {Array} All categories
   */
  getAllCategories() {
    return this.categories;
  }

  /**
   * Get a category by ID
   * @param {string} id - Category ID
   * @returns {Object|null} Category or null
   */
  getCategoryById(id) {
    return this.categories.find(c => c.id === id) || null;
  }

  /**
   * Get a category by slug
   * @param {string} slug - Category slug
   * @returns {Object|null} Category or null
   */
  getCategoryBySlug(slug) {
    return this.categories.find(c => c.slug === slug) || null;
  }

  /**
   * Get featured categories
   * @returns {Array} Featured categories
   */
  getFeaturedCategories() {
    return this.categories.filter(c => c.featured);
  }

  // ==================== COLLECTION METHODS ====================

  /**
   * Get all collections
   * @returns {Array} All collections
   */
  getAllCollections() {
    return this.collections;
  }

  /**
   * Get a collection by ID
   * @param {string} id - Collection ID
   * @returns {Object|null} Collection or null
   */
  getCollectionById(id) {
    return this.collections.find(c => c.id === id) || null;
  }

  /**
   * Get a collection by slug
   * @param {string} slug - Collection slug
   * @returns {Object|null} Collection or null
   */
  getCollectionBySlug(slug) {
    return this.collections.find(c => c.slug === slug) || null;
  }

  /**
   * Get products in a collection
   * @param {string} collectionId - Collection ID
   * @param {number} limit - Maximum number of products
   * @returns {Array} Products in collection
   */
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

  /**
   * Get collections to show on homepage
   * @returns {Array} Homepage collections
   */
  getHomepageCollections() {
    return this.collections
      .filter(c => c.showOnHomepage)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // ==================== FILTER METHODS ====================

  /**
   * Get all available filters
   * @returns {Object} All filter options
   */
  getFilters() {
    return this.filters;
  }

  /**
   * Get filter options for a category
   * @param {string} categoryId - Category ID
   * @returns {Object} Filter options with counts
   */
  getFilterOptionsForCategory(categoryId) {
    const products = this.getProductsByCategory(categoryId);
    
    return {
      colors: this.getColorCounts(products),
      fabrics: this.getFabricCounts(products),
      occasions: this.getOccasionCounts(products),
      priceRanges: this.getPriceRangeCounts(products)
    };
  }

  /**
   * Get color counts for products
   * @private
   */
  getColorCounts(products) {
    const counts = {};
    products.forEach(p => {
      const color = p.attributes?.color?.name;
      if (color) {
        counts[color] = (counts[color] || 0) + 1;
      }
    });
    return counts;
  }

  /**
   * Get fabric counts for products
   * @private
   */
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

  /**
   * Get occasion counts for products
   * @private
   */
  getOccasionCounts(products) {
    const counts = {};
    products.forEach(p => {
      (p.attributes?.occasion || []).forEach(occ => {
        counts[occ] = (counts[occ] || 0) + 1;
      });
    });
    return counts;
  }

  /**
   * Get price range counts for products
   * @private
   */
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

  /**
   * Format price for display
   * @param {number} price - Price in INR
   * @returns {string} Formatted price
   */
  formatPrice(price) {
    return `₹${price.toLocaleString('en-IN')}`;
  }

  /**
   * Get product count
   * @returns {number} Total product count
   */
  getProductCount() {
    return this.products.length;
  }

  /**
   * Parse URL filters from query string
   * @param {string} queryString - URL query string
   * @returns {Object} Parsed filters
   */
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

  /**
   * Build URL from filters
   * @param {Object} filters - Filter object
   * @returns {string} URL query string
   */
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
