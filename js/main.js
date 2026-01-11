/**
 * Loom Saga - Main JavaScript
 * Handles interactive features for the e-commerce website
 */

// ==================== DOM ELEMENTS ====================
const header = document.getElementById('header');
const searchBtn = document.getElementById('searchBtn');
const accountBtn = document.getElementById('accountBtn');
const hamburger = document.getElementById('hamburger');
const mainNav = document.querySelector('.main-nav');
const navOverlay = document.getElementById('navOverlay');

// ==================== HEADER SCROLL EFFECT ====================
/**
 * Header visibility management:
 * - Hide on scroll down
 * - Show on scroll up
 * - Remove entirely when reaching footer
 */
let lastScrollY = window.scrollY;
let headerVisible = true;

function handleHeaderScroll() {
    const currentScrollY = window.scrollY;
    const footer = document.getElementById('footer');
    const footerTop = footer ? footer.offsetTop : Infinity;
    const windowHeight = window.innerHeight;
    
    // If mega menu is active, do nothing - let the absolute positioning handle it
    if (typeof DesktopMegaMenuController !== 'undefined' && DesktopMegaMenuController.activeDropdown) {
        return;
    }
    
    // Add/remove scrolled class for background
    if (currentScrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    // Hide header when reaching footer
    if (currentScrollY + windowHeight >= footerTop - 50) {
        header.classList.add('header-hidden');
        headerVisible = false;
        lastScrollY = currentScrollY;
        return;
    }
    
    // Scrolling down - hide header (only after scrolling 100px)
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
        if (headerVisible) {
            header.classList.add('header-hidden');
            headerVisible = false;
        }
    }
    // Scrolling up - show header
    else if (currentScrollY < lastScrollY) {
        if (!headerVisible) {
            header.classList.remove('header-hidden');
            headerVisible = true;
        }
    }
    
    lastScrollY = currentScrollY;
}

// Listen for scroll events with throttling for performance
let ticking = false;
window.addEventListener('scroll', function() {
    if (!ticking) {
        window.requestAnimationFrame(function() {
            handleHeaderScroll();
            ticking = false;
        });
        ticking = true;
    }
});

// ==================== HEADER INITIALIZATION ====================
/**
 * Ensure header is always visible on page load
 * This fixes the issue where browser restores scroll position on refresh
 * and the header remains hidden
 */
function initializeHeader() {
    if (header) {
        // Always ensure header is visible on page load
        header.classList.remove('header-hidden');
        headerVisible = true;
        
        // Set the scrolled class if page is already scrolled
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        }
        
        // Reset lastScrollY to current position
        lastScrollY = window.scrollY;
    }
}

// Initialize header on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeader);
} else {
    initializeHeader();
}

// Also initialize on window load (fallback for cached pages)
window.addEventListener('load', initializeHeader);

// ==================== MOBILE NAVIGATION ====================
/**
 * Toggle mobile navigation menu
 */
function toggleMobileNav() {
    const isOpen = hamburger.classList.contains('active');
    
    hamburger.classList.toggle('active');
    mainNav.classList.toggle('active');
    navOverlay.classList.toggle('active');
    
    // Update ARIA attribute
    hamburger.setAttribute('aria-expanded', !isOpen);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = !isOpen ? 'hidden' : '';
}

/**
 * Close mobile navigation menu
 */
function closeMobileNav() {
    hamburger.classList.remove('active');
    mainNav.classList.remove('active');
    navOverlay.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

// ==================== SEARCH FUNCTIONALITY ====================
/**
 * Search Manager - Handles search modal and live search
 */
const SearchManager = {
    modal: null,
    input: null,
    results: null,
    closeBtn: null,
    overlay: null,
    debounceTimer: null,
    
    // Sample product data for search (in production, this would come from API/database)
    products: [
        { id: 'LS-VSK-001', name: 'Lime green Hand-printed Vishnupuri Silk', price: 5199, image: 'https://placehold.co/100x120/9acd32/333?text=Green', url: 'product-detail.html' },
        { id: 'LS-VSK-002', name: 'Mustard Yellow Vishnupuri Silk', price: 5199, image: 'https://placehold.co/100x120/d4a017/333?text=Yellow', url: 'product-detail.html' },
        { id: 'LS-VSK-003', name: 'Red Vishnupuri Silk Saree', price: 5499, image: 'https://placehold.co/100x120/dc143c/fff?text=Red', url: 'product-detail.html' },
        { id: 'LS-VSK-004', name: 'Jet Black Printed Vishnupuri Silk', price: 5199, image: 'https://placehold.co/100x120/333/fff?text=Black', url: 'product-detail.html' },
        { id: 'LS-MSL-001', name: 'White Muslin Jamdani Saree', price: 4599, image: 'https://placehold.co/100x120/f5f5dc/333?text=White', url: 'product-detail.html' },
        { id: 'LS-MSL-002', name: 'Blue Muslin Cotton Saree', price: 4299, image: 'https://placehold.co/100x120/4169e1/fff?text=Blue', url: 'product-detail.html' },
        { id: 'LS-TSR-001', name: 'Tussar Silk Wedding Saree', price: 6999, image: 'https://placehold.co/100x120/8b4513/fff?text=Tussar', url: 'product-detail.html' },
        { id: 'LS-MDL-001', name: 'Modal Silk Lightweight Saree', price: 3999, image: 'https://placehold.co/100x120/deb887/333?text=Modal', url: 'product-detail.html' },
    ],
    
    init() {
        this.modal = document.getElementById('searchModal');
        this.input = document.getElementById('searchInput');
        this.results = document.getElementById('searchResults');
        this.closeBtn = document.getElementById('searchClose');
        this.overlay = this.modal?.querySelector('.search-modal-overlay');
        
        if (!this.modal) return;
        
        // Bind events
        this.bindEvents();
    },
    
    bindEvents() {
        // Open search on search button click
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.open());
        }
        
        // Close on close button click
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        // Close on overlay click
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
        
        // Live search on input
        if (this.input) {
            this.input.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.search(e.target.value);
                }, 300); // Debounce 300ms
            });
        }
    },
    
    open() {
        this.modal.classList.add('active');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Focus input after animation
        setTimeout(() => {
            this.input?.focus();
        }, 100);
    },
    
    close() {
        this.modal.classList.remove('active');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Clear search
        if (this.input) this.input.value = '';
        if (this.results) this.results.innerHTML = '';
    },
    
    search(query) {
        if (!this.results) return;
        
        const trimmedQuery = query.trim().toLowerCase();
        
        if (trimmedQuery.length < 2) {
            this.results.innerHTML = '';
            return;
        }
        
        // Filter products
        const matches = this.products.filter(product => 
            product.name.toLowerCase().includes(trimmedQuery)
        );
        
        // Render results
        if (matches.length > 0) {
            this.results.innerHTML = matches.map(product => `
                <a href="${product.url}" class="search-result-item">
                    <img src="${product.image}" alt="${product.name}" class="search-result-image">
                    <div class="search-result-info">
                        <div class="search-result-name">${this.highlightMatch(product.name, trimmedQuery)}</div>
                        <div class="search-result-price">Rs.${product.price.toLocaleString('en-IN')}/-</div>
                    </div>
                </a>
            `).join('');
        } else {
            this.results.innerHTML = `
                <div class="search-no-results">
                    No products found for "${query}"
                </div>
            `;
        }
    },
    
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
};

// Hamburger menu click handler
if (hamburger) {
    hamburger.addEventListener('click', toggleMobileNav);
}

// Close menu when clicking overlay
if (navOverlay) {
    navOverlay.addEventListener('click', closeMobileNav);
}

// Close menu when clicking on nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        // Only close on mobile
        if (window.innerWidth < 768) {
            closeMobileNav();
        }
    });
});

// Close menu on window resize (e.g., switching to landscape)
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        closeMobileNav();
        // Close any open dropdowns
        document.querySelectorAll('.has-dropdown.active').forEach(el => {
            el.classList.remove('active');
        });
    }
});

// Mobile Dropdown Toggle
const dropdowns = document.querySelectorAll('.has-dropdown');
dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector('.nav-link');
    link.addEventListener('click', (e) => {
        if (window.innerWidth < 768) {
            e.preventDefault();
            e.stopPropagation(); // Prevent closing menu
            dropdown.classList.toggle('active');
        }
    });
});

// ==================== DESKTOP MEGA MENU HOVER ====================
/**
 * Desktop Mega Menu Controller
 * Uses JavaScript to explicitly control which mega menu is visible,
 * preventing z-index stacking issues where multiple menus overlap.
 */
const DesktopMegaMenuController = {
    activeDropdown: null,
    hideTimeout: null,
    headerLocked: false,
    
    init() {
        // Only apply on desktop
        if (window.innerWidth < 768) return;
        
        const dropdownItems = document.querySelectorAll('.nav-item.has-dropdown');
        
        dropdownItems.forEach(item => {
            const megaMenu = item.querySelector('.mega-menu');
            
            // Mouse enters nav item - show its mega menu
            item.addEventListener('mouseenter', () => {
                if (window.innerWidth < 768) return;
                this.showMenu(item, megaMenu);
            });
            
            // Mouse leaves nav item
            item.addEventListener('mouseleave', () => {
                if (window.innerWidth < 768) return;
                this.scheduleHide(item, megaMenu);
            });
            
            // Mouse enters mega menu - keep it visible
            if (megaMenu) {
                megaMenu.addEventListener('mouseenter', () => {
                    if (window.innerWidth < 768) return;
                    this.cancelHide();
                });
                
                // Mouse leaves mega menu - hide it
                megaMenu.addEventListener('mouseleave', () => {
                    if (window.innerWidth < 768) return;
                    this.hideMenu(item, megaMenu);
                });
            }
        });
        
        // Reinitialize on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                this.hideAllMenus();
            }
        });
    },
    
    showMenu(item, megaMenu) {
        this.cancelHide();
        
        // Hide any other active menus first
        if (this.activeDropdown && this.activeDropdown !== item) {
            const activeMegaMenu = this.activeDropdown.querySelector('.mega-menu');
            if (activeMegaMenu) {
                this.activeDropdown.classList.remove('mega-menu-active');
                activeMegaMenu.classList.remove('mega-menu-visible');
            }
        }
        
        // Lock header to background
        this.lockHeader();
        
        // Show this menu
        if (megaMenu) {
            item.classList.add('mega-menu-active');
            megaMenu.classList.add('mega-menu-visible');
            this.activeDropdown = item;
        }
    },
    
    lockHeader() {
        if (this.headerLocked) return;
        
        const scrollY = window.scrollY;
        
        // Only lock if we are scrolled down a bit (to avoid jumping at very top)
        // or effectively, just always lock it to current position so it moves up when scrolling
        header.style.position = 'absolute';
        header.style.top = `${scrollY}px`;
        header.style.width = '100%';
        this.headerLocked = true;
    },
    
    unlockHeader() {
        if (!this.headerLocked) return;
        
        header.style.position = '';
        header.style.top = '';
        header.style.width = '';
        this.headerLocked = false;
        
        // Re-run checking for scroll state to ensure correct class
        handleHeaderScroll();
    },
    
    scheduleHide(item, megaMenu) {
        // Small delay to allow moving to mega menu
        this.hideTimeout = setTimeout(() => {
            this.hideMenu(item, megaMenu);
        }, 50);
    },
    
    hideMenu(item, megaMenu) {
        if (megaMenu) {
            item.classList.remove('mega-menu-active');
            megaMenu.classList.remove('mega-menu-visible');
        }
        if (this.activeDropdown === item) {
            this.activeDropdown = null;
            this.unlockHeader();
        }
    },
    
    cancelHide() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    },
    
    hideAllMenus() {
        document.querySelectorAll('.nav-item.has-dropdown').forEach(item => {
            item.classList.remove('mega-menu-active');
            const megaMenu = item.querySelector('.mega-menu');
            if (megaMenu) {
                megaMenu.classList.remove('mega-menu-visible');
            }
        });
        this.activeDropdown = null;
        this.unlockHeader();
    }
};

// Initialize desktop mega menu controller
DesktopMegaMenuController.init();

// ==================== CART MANAGER ====================
/**
 * Cart Manager - Handles all cart operations with localStorage persistence
 */
const CartManager = {
    storageKey: 'loomSaga_cart',
    
    /**
     * Get all cart items
     * @returns {Array} Cart items array
     */
    getItems() {
        const cart = localStorage.getItem(this.storageKey);
        return cart ? JSON.parse(cart) : [];
    },
    
    /**
     * Save cart items to localStorage
     * @param {Array} items - Cart items array
     */
    saveItems(items) {
        localStorage.setItem(this.storageKey, JSON.stringify(items));
        this.updateBadge();
    },
    
    /**
     * Add item to cart
     * @param {Object} product - Product object
     */
    addItem(product) {
        const items = this.getItems();
        const existingIndex = items.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            // Increase quantity if item exists
            items[existingIndex].quantity += 1;
        } else {
            // Add new item with quantity 1
            items.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveItems(items);
        this.showNotification(`${product.name} added to cart`);
        return items;
    },
    
    /**
     * Remove item from cart
     * @param {string} productId - Product ID to remove
     */
    removeItem(productId) {
        const items = this.getItems().filter(item => item.id !== productId);
        this.saveItems(items);
        this.renderCart();
        return items;
    },
    
    /**
     * Update item quantity
     * @param {string} productId - Product ID
     * @param {number} quantity - New quantity
     */
    updateQuantity(productId, quantity) {
        const items = this.getItems();
        const itemIndex = items.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                items.splice(itemIndex, 1);
            } else {
                items[itemIndex].quantity = quantity;
            }
        }
        
        this.saveItems(items);
        this.renderCart();
        return items;
    },
    
    /**
     * Get cart total
     * @returns {number} Total price
     */
    getTotal() {
        return this.getItems().reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },
    
    /**
     * Get total items count
     * @returns {number} Total items
     */
    getItemCount() {
        return this.getItems().reduce((count, item) => count + item.quantity, 0);
    },
    
    /**
     * Update cart badge in header
     */
    updateBadge() {
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) {
            const count = this.getItemCount();
            cartCountEl.textContent = count;
            cartCountEl.style.display = count > 0 ? 'flex' : 'none';
        }
    },
    
    /**
     * Format price in Indian Rupees
     * @param {number} amount - Amount to format
     * @returns {string} Formatted price
     */
    formatPrice(amount) {
        return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    },
    
    /**
     * Show notification toast
     * @param {string} message - Message to show
     */
    showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('.cart-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    /**
     * Render cart items on cart page
     */
    renderCart() {
        const cartItemsEl = document.getElementById('cartItems');
        const cartSummaryEl = document.getElementById('cartSummary');
        const cartEmptyEl = document.getElementById('cartEmpty');
        const cartContentEl = document.getElementById('cartContent');
        
        if (!cartItemsEl) return; // Not on cart page
        
        const items = this.getItems();
        
        if (items.length === 0) {
            // Show empty state
            if (cartContentEl) cartContentEl.style.display = 'none';
            if (cartEmptyEl) cartEmptyEl.style.display = 'block';
            return;
        }
        
        // Show cart content
        if (cartContentEl) cartContentEl.style.display = 'block';
        if (cartEmptyEl) cartEmptyEl.style.display = 'none';
        
        // Render items
        cartItemsEl.innerHTML = items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${item.name}</h3>
                    <p class="cart-item-price">${this.formatPrice(item.price)}</p>
                    <div class="cart-item-meta">
                        <span>Color: ${item.color || 'Not specified'}</span>
                        <span>Style: ${item.style || 'None'}</span>
                    </div>
                </div>
                <div class="cart-item-quantity">
                    <div class="quantity-control">
                        <button class="quantity-btn quantity-minus" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn quantity-plus" data-id="${item.id}" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}" aria-label="Remove item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <div class="cart-item-total-wrapper">
                    <span class="cart-item-total">${this.formatPrice(item.price * item.quantity)}</span>
                </div>
            </div>
        `).join('');

        
        // Update total
        const totalEl = document.getElementById('cartTotalAmount');
        if (totalEl) {
            totalEl.textContent = this.formatPrice(this.getTotal());
        }
        
        // Bind event listeners
        this.bindCartEvents();
    },
    
    /**
     * Bind event listeners to cart controls
     */
    bindCartEvents() {
        // Quantity decrease buttons
        document.querySelectorAll('.quantity-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const items = this.getItems();
                const item = items.find(i => i.id === id);
                if (item) {
                    this.updateQuantity(id, item.quantity - 1);
                }
            });
        });
        
        // Quantity increase buttons
        document.querySelectorAll('.quantity-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const items = this.getItems();
                const item = items.find(i => i.id === id);
                if (item) {
                    this.updateQuantity(id, item.quantity + 1);
                }
            });
        });
        
        // Remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.removeItem(id);
            });
        });
    },
    
    /**
     * Clear entire cart
     */
    clearCart() {
        this.saveItems([]);
        this.renderCart();
    }
};

// ==================== WISHLIST MANAGER ====================
/**
 * Wishlist Manager - Handles wishlist operations with localStorage persistence
 */
const WishlistManager = {
    storageKey: 'loomSaga_wishlist',
    
    /**
     * Get all wishlist items
     * @returns {Array} Wishlist items array
     */
    getItems() {
        const wishlist = localStorage.getItem(this.storageKey);
        return wishlist ? JSON.parse(wishlist) : [];
    },
    
    /**
     * Save wishlist items to localStorage
     * @param {Array} items - Wishlist items array
     */
    saveItems(items) {
        localStorage.setItem(this.storageKey, JSON.stringify(items));
        this.updateBadge();
    },
    
    /**
     * Add item to wishlist
     * @param {Object} product - Product object with id, name, price, image
     */
    addItem(product) {
        const items = this.getItems();
        const existingIndex = items.findIndex(item => item.id === product.id);
        
        if (existingIndex === -1) {
            items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                addedAt: new Date().toISOString()
            });
            this.saveItems(items);
            this.showNotification(`${product.name} added to wishlist`);
        }
    },
    
    /**
     * Remove item from wishlist
     * @param {string} productId - Product ID to remove
     */
    removeItem(productId) {
        const items = this.getItems();
        const filteredItems = items.filter(item => item.id !== productId);
        this.saveItems(filteredItems);
        this.showNotification('Removed from wishlist');
    },
    
    /**
     * Toggle item in wishlist
     * @param {Object} product - Product object
     * @returns {boolean} - true if added, false if removed
     */
    toggleItem(product) {
        if (this.hasItem(product.id)) {
            this.removeItem(product.id);
            return false;
        } else {
            this.addItem(product);
            return true;
        }
    },
    
    /**
     * Check if item is in wishlist
     * @param {string} productId - Product ID to check
     * @returns {boolean}
     */
    hasItem(productId) {
        const items = this.getItems();
        return items.some(item => item.id === productId);
    },
    
    /**
     * Get wishlist count
     * @returns {number}
     */
    getCount() {
        return this.getItems().length;
    },
    
    /**
     * Update wishlist badge in header
     */
    updateBadge() {
        const count = this.getCount();
        const wishlistCountEls = document.querySelectorAll('#wishlistCount');
        wishlistCountEls.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    },
    
    /**
     * Show notification toast
     * @param {string} message
     */
    showNotification(message) {
        // Use CartManager's notification if available
        if (CartManager && CartManager.showNotification) {
            CartManager.showNotification(message);
        }
    },
    
    /**
     * Clear entire wishlist
     */
    clearWishlist() {
        this.saveItems([]);
    }
};

// ==================== WISHLIST PAGE MANAGER ====================
/**
 * Wishlist Page Manager - Handles rendering and pagination on wishlist page
 */
const WishlistPageManager = {
    itemsPerPage: 6,
    currentPage: 1,
    totalPages: 1,
    
    /**
     * Initialize wishlist page
     */
    init() {
        const wishlistGrid = document.getElementById('wishlistGrid');
        if (!wishlistGrid) return; // Not on wishlist page
        
        this.render();
    },
    
    /**
     * Render wishlist items for current page
     */
    render() {
        const wishlistGrid = document.getElementById('wishlistGrid');
        const wishlistEmpty = document.getElementById('wishlistEmpty');
        const wishlistPagination = document.getElementById('wishlistPagination');
        const wishlistItemCount = document.getElementById('wishlistItemCount');
        
        if (!wishlistGrid) return;
        
        const items = WishlistManager.getItems();
        
        // Update item count
        if (wishlistItemCount) {
            wishlistItemCount.textContent = items.length;
        }
        
        // Handle empty state
        if (items.length === 0) {
            wishlistGrid.innerHTML = '';
            if (wishlistEmpty) wishlistEmpty.style.display = 'block';
            if (wishlistPagination) wishlistPagination.style.display = 'none';
            return;
        }
        
        if (wishlistEmpty) wishlistEmpty.style.display = 'none';
        
        // Calculate pagination
        this.totalPages = Math.ceil(items.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = items.slice(startIndex, endIndex);
        
        // Render items
        wishlistGrid.innerHTML = pageItems.map(item => `
            <article class="wishlist-card" data-product-id="${item.id}" data-product-name="${item.name}" data-product-price="${item.price}" data-product-image="${item.image}">
                <a href="product-detail.html" class="wishlist-card-link">
                    <div class="wishlist-card-image">
                        <img src="${item.image}" alt="${item.name}" loading="lazy">
                        <button class="wishlist-remove-btn active" aria-label="Remove from Wishlist" data-id="${item.id}">
                            <img src="assets/icons/heart-filled.png" alt="" class="heart-filled">
                        </button>
                    </div>
                    <div class="wishlist-card-info">
                        <h2 class="wishlist-card-name">${item.name}</h2>
                        <p class="wishlist-card-price">Rs.${item.price.toLocaleString('en-IN')}/-</p>
                    </div>
                </a>
                <button class="wishlist-add-btn" data-id="${item.id}">Add To Bag</button>
            </article>
        `).join('');
        
        // Render pagination
        this.renderPagination();
        
        // Bind events
        this.bindEvents();
    },
    
    /**
     * Render pagination controls
     */
    renderPagination() {
        const wishlistPagination = document.getElementById('wishlistPagination');
        if (!wishlistPagination) return;
        
        // Hide pagination if only one page
        if (this.totalPages <= 1) {
            wishlistPagination.style.display = 'none';
            return;
        }
        
        wishlistPagination.style.display = 'flex';
        
        const paginationNumbers = wishlistPagination.querySelector('.pagination-numbers');
        if (paginationNumbers) {
            paginationNumbers.innerHTML = '';
            for (let i = 1; i <= this.totalPages; i++) {
                const btn = document.createElement('button');
                btn.className = 'pagination-number' + (i === this.currentPage ? ' active' : '');
                btn.textContent = i;
                btn.dataset.page = i;
                paginationNumbers.appendChild(btn);
            }
        }
        
        // Update prev/next button states
        const prevBtn = wishlistPagination.querySelector('.pagination-prev');
        const nextBtn = wishlistPagination.querySelector('.pagination-next');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
            prevBtn.style.opacity = this.currentPage === 1 ? '0.3' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === this.totalPages;
            nextBtn.style.opacity = this.currentPage === this.totalPages ? '0.3' : '1';
        }
    },
    
    /**
     * Navigate to specific page
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.render();
        
        // Scroll to top of wishlist
        const wishlistPage = document.querySelector('.wishlist-page');
        if (wishlistPage) {
            wishlistPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Remove buttons
        document.querySelectorAll('.wishlist-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = btn.dataset.id;
                if (productId) {
                    WishlistManager.removeItem(productId);
                    
                    // Re-render after a short delay for animation
                    const card = btn.closest('.wishlist-card');
                    if (card) {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.9)';
                        card.style.transition = 'all 0.3s ease';
                    }
                    
                    setTimeout(() => {
                        // Adjust current page if necessary
                        const items = WishlistManager.getItems();
                        const newTotalPages = Math.ceil(items.length / this.itemsPerPage);
                        if (this.currentPage > newTotalPages && newTotalPages > 0) {
                            this.currentPage = newTotalPages;
                        }
                        this.render();
                    }, 300);
                }
            });
        });
        
        // Add to bag buttons
        document.querySelectorAll('.wishlist-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const card = btn.closest('.wishlist-card');
                if (card) {
                    const product = {
                        id: card.dataset.productId,
                        name: card.dataset.productName,
                        price: parseFloat(card.dataset.productPrice),
                        image: card.dataset.productImage
                    };
                    CartManager.addItem(product);
                }
            });
        });
        
        // Pagination events
        const wishlistPagination = document.getElementById('wishlistPagination');
        if (wishlistPagination) {
            const prevBtn = wishlistPagination.querySelector('.pagination-prev');
            const nextBtn = wishlistPagination.querySelector('.pagination-next');
            const numbersContainer = wishlistPagination.querySelector('.pagination-numbers');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
            }
            
            if (numbersContainer) {
                numbersContainer.addEventListener('click', (e) => {
                    if (e.target.classList.contains('pagination-number')) {
                        const page = parseInt(e.target.dataset.page);
                        this.goToPage(page);
                    }
                });
            }
        }
    }
};

// Legacy function for compatibility
function updateWishlistCount(count) {
    const wishlistCountEl = document.getElementById('wishlistCount');
    if (wishlistCountEl) {
        wishlistCountEl.textContent = count;
        wishlistCountEl.style.display = count > 0 ? 'flex' : 'none';
    }
}

function getWishlist() {
    return WishlistManager.getItems();
}

// ==================== CHECKOUT HANDLER ====================
function initCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const items = CartManager.getItems();
            if (items.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            // For now, show alert - later this would go to checkout page
            alert(`Proceeding to checkout with ${CartManager.getItemCount()} items.\nTotal: ${CartManager.formatPrice(CartManager.getTotal())}`);
        });
    }
}

// ==================== CAROUSEL DRAG SCROLL ====================
/**
 * Initialize drag-to-scroll for all carousels
 */
function initCarousels() {
    const carousels = document.querySelectorAll('.carousel-track, .insights-carousel');
    
    carousels.forEach(carousel => {
        let isDown = false;
        let startX;
        let scrollLeft;
        
        carousel.addEventListener('mousedown', (e) => {
            isDown = true;
            carousel.classList.add('active');
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });
        
        carousel.addEventListener('mouseleave', () => {
            isDown = false;
            carousel.classList.remove('active');
        });
        
        carousel.addEventListener('mouseup', () => {
            isDown = false;
            carousel.classList.remove('active');
        });
        
        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed multiplier
            carousel.scrollLeft = scrollLeft - walk;
        });
        
        // Touch support for mobile
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        }, { passive: true });
        
        carousel.addEventListener('touchmove', (e) => {
            const x = e.touches[0].pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2;
            carousel.scrollLeft = scrollLeft - walk;
        }, { passive: true });
    });
}

// ==================== ADD TO CART FROM PRODUCT CARDS ====================
/**
 * Initialize add-to-cart functionality for product cards
 * This can be extended when product pages are built
 */
function initProductCards() {
    // Demo: Add sample product to cart for testing
    // This will be replaced with actual product data later
    window.addDemoProduct = function() {
        CartManager.addItem({
            id: 'saree-001',
            name: 'Lime Green Hand Printed Vishnupuri Silk',
            price: 5199,
            image: 'https://placehold.co/300x400/a8c8b0/333333?text=Saree',
            color: 'Lime Green',
            style: 'None'
        });
    };
    
    window.addDemoProduct2 = function() {
        CartManager.addItem({
            id: 'saree-002',
            name: 'Royal Blue Banarasi Silk',
            price: 8499,
            image: 'https://placehold.co/300x400/4a6fa5/ffffff?text=Blue+Saree',
            color: 'Royal Blue',
            style: 'Traditional'
        });
    };
}

// ==================== PAGINATION ====================
/**
 * Pagination Manager - Handles article pagination on Fashion Insights page
 */
const PaginationManager = {
    articlesPerPage: 6,
    currentPage: 1,
    totalPages: 1,
    articles: [],
    
    /**
     * Initialize pagination
     */
    init() {
        const grid = document.querySelector('.insights-grid');
        const pagination = document.getElementById('pagination');
        
        if (!grid || !pagination) return;
        
        this.articles = Array.from(grid.querySelectorAll('.insight-card'));
        this.totalPages = Math.ceil(this.articles.length / this.articlesPerPage);
        
        // If only one page, hide pagination
        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        this.renderPagination();
        this.showPage(1);
        this.bindEvents();
    },
    
    /**
     * Render pagination numbers
     */
    renderPagination() {
        const container = document.getElementById('paginationNumbers');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 1; i <= this.totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = 'pagination-number' + (i === this.currentPage ? ' active' : '');
            btn.textContent = i;
            btn.dataset.page = i;
            container.appendChild(btn);
        }
        
        // Add ellipsis if more than 4 pages
        if (this.totalPages > 4) {
            const numbers = container.querySelectorAll('.pagination-number');
            // Show: 1, 2, 3, 4, ..., last
            // This is a simple implementation - can be enhanced for larger page counts
        }
    },
    
    /**
     * Show specific page
     * @param {number} page - Page number to show
     */
    showPage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        
        const startIndex = (page - 1) * this.articlesPerPage;
        const endIndex = startIndex + this.articlesPerPage;
        
        // Hide all articles, then show current page's articles
        this.articles.forEach((article, index) => {
            if (index >= startIndex && index < endIndex) {
                article.style.display = '';
            } else {
                article.style.display = 'none';
            }
        });
        
        // Update active page number
        const pageNumbers = document.querySelectorAll('.pagination-number');
        pageNumbers.forEach(num => {
            num.classList.toggle('active', parseInt(num.dataset.page) === page);
        });
        
        // Update prev/next button states
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.disabled = page === 1;
            prevBtn.style.opacity = page === 1 ? '0.3' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = page === this.totalPages;
            nextBtn.style.opacity = page === this.totalPages ? '0.3' : '1';
        }
        
        // Smooth scroll to top of articles section
        const gridSection = document.querySelector('.insights-grid-section');
        if (gridSection) {
            gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },
    
    /**
     * Bind pagination event listeners
     */
    bindEvents() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const numbersContainer = document.getElementById('paginationNumbers');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.showPage(this.currentPage - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.showPage(this.currentPage + 1);
            });
        }
        
        if (numbersContainer) {
            numbersContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('pagination-number')) {
                    const page = parseInt(e.target.dataset.page);
                    this.showPage(page);
                }
            });
        }
    }
};

// ==================== INITIALIZATION ====================
/**
 * Initialize the application
 */
function init() {
    // Update cart badge from localStorage
    CartManager.updateBadge();
    
    // Update wishlist badge
    const wishlist = getWishlist();
    updateWishlistCount(wishlist.length);
    
    // Initial header state
    handleHeaderScroll();
    
    // Initialize carousels
    initCarousels();
    
    // Initialize cart page if we're on it
    CartManager.renderCart();
    
    // Initialize checkout button
    initCheckout();
    
    // Initialize product card listeners
    initProductCards();
    
    // Initialize pagination (for Fashion Insights page)
    PaginationManager.init();
    
    // Initialize wishlist buttons on product cards
    initWishlistButtons();
    
    // Initialize wishlist page (if on wishlist page)
    WishlistPageManager.init();
    
    // Initialize search functionality
    SearchManager.init();
    
    // Initialize filter/sort functionality
    FilterSortManager.init();
    
    console.log('Loom Saga initialized successfully');
}

// ==================== FILTER & SORT MANAGER ====================
/**
 * Filter & Sort Manager - Handles product filtering and sorting on listing pages
 */
const FilterSortManager = {
    sortBtn: null,
    sortDropdown: null,
    filterBtn: null,
    filterPanel: null,
    filterClose: null,
    filterClear: null,
    filterApply: null,
    productsGrid: null,
    
    init() {
        this.sortBtn = document.getElementById('sortBtn');
        this.sortDropdown = document.getElementById('sortDropdown');
        this.filterBtn = document.getElementById('filterBtn');
        this.filterPanel = document.getElementById('filterPanel');
        this.filterClose = document.getElementById('filterClose');
        this.filterClear = document.getElementById('filterClear');
        this.filterApply = document.getElementById('filterApply');
        this.productsGrid = document.querySelector('.products-grid');
        
        if (!this.sortBtn && !this.filterBtn) return;
        
        this.bindEvents();
        this.createOverlay();
    },
    
    createOverlay() {
        // Create filter overlay if it doesn't exist
        if (!document.querySelector('.filter-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'filter-overlay';
            overlay.id = 'filterOverlay';
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', () => this.closeFilter());
        }
    },
    
    bindEvents() {
        // Sort dropdown toggle
        if (this.sortBtn) {
            this.sortBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSort();
            });
        }
        
        // Sort options
        if (this.sortDropdown) {
            const sortOptions = this.sortDropdown.querySelectorAll('.sort-option');
            sortOptions.forEach(option => {
                option.addEventListener('click', () => {
                    this.applySort(option.dataset.sort);
                    this.closeSort();
                    
                    // Update active state
                    sortOptions.forEach(o => o.classList.remove('active'));
                    option.classList.add('active');
                });
            });
        }
        
        // Filter button
        if (this.filterBtn) {
            this.filterBtn.addEventListener('click', () => this.openFilter());
        }
        
        // Filter close button
        if (this.filterClose) {
            this.filterClose.addEventListener('click', () => this.closeFilter());
        }
        
        // Filter clear button
        if (this.filterClear) {
            this.filterClear.addEventListener('click', () => this.clearFilters());
        }
        
        // Filter apply button
        if (this.filterApply) {
            this.filterApply.addEventListener('click', () => {
                this.applyFilters();
                this.closeFilter();
            });
        }
        
        // Close sort on outside click
        document.addEventListener('click', () => this.closeSort());
        
        // Close filter on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSort();
                this.closeFilter();
            }
        });
    },
    
    toggleSort() {
        if (this.sortDropdown) {
            this.sortDropdown.classList.toggle('active');
            this.sortBtn.setAttribute('aria-expanded', 
                this.sortDropdown.classList.contains('active'));
        }
    },
    
    closeSort() {
        if (this.sortDropdown) {
            this.sortDropdown.classList.remove('active');
            this.sortBtn?.setAttribute('aria-expanded', 'false');
        }
    },
    
    openFilter() {
        if (this.filterPanel) {
            this.filterPanel.classList.add('active');
            document.body.style.overflow = 'hidden';
            document.getElementById('filterOverlay')?.classList.add('active');
        }
    },
    
    closeFilter() {
        if (this.filterPanel) {
            this.filterPanel.classList.remove('active');
            document.body.style.overflow = '';
            document.getElementById('filterOverlay')?.classList.remove('active');
        }
    },
    
    applySort(sortType) {
        if (!this.productsGrid) return;
        
        const products = Array.from(this.productsGrid.querySelectorAll('.product-card'));
        
        products.sort((a, b) => {
            const nameA = a.querySelector('.product-card-name')?.textContent || '';
            const nameB = b.querySelector('.product-card-name')?.textContent || '';
            const priceA = this.extractPrice(a.querySelector('.product-card-price')?.textContent);
            const priceB = this.extractPrice(b.querySelector('.product-card-price')?.textContent);
            
            switch(sortType) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                case 'name-az':
                    return nameA.localeCompare(nameB);
                case 'name-za':
                    return nameB.localeCompare(nameA);
                case 'newest':
                default:
                    return 0; // Keep original order
            }
        });
        
        // Re-append sorted products
        products.forEach(product => this.productsGrid.appendChild(product));
        
        // Show notification
        CartManager.showNotification(`Sorted by: ${this.getSortLabel(sortType)}`);
    },
    
    extractPrice(priceText) {
        if (!priceText) return 0;
        return parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
    },
    
    getSortLabel(sortType) {
        const labels = {
            'newest': 'Newest First',
            'price-low': 'Price: Low to High',
            'price-high': 'Price: High to Low',
            'name-az': 'Name: A to Z',
            'name-za': 'Name: Z to A'
        };
        return labels[sortType] || 'Default';
    },
    
    clearFilters() {
        // Uncheck all checkboxes
        const checkboxes = this.filterPanel?.querySelectorAll('input[type="checkbox"]');
        checkboxes?.forEach(cb => cb.checked = false);
        
        // Show all products
        const products = this.productsGrid?.querySelectorAll('.product-card');
        products?.forEach(product => product.style.display = '');
        
        CartManager.showNotification('Filters cleared');
    },
    
    applyFilters() {
        // This is a demo implementation - in production would filter based on product data
        const selectedColors = this.getCheckedValues('color');
        const selectedFabrics = this.getCheckedValues('fabric');
        const selectedPrices = this.getCheckedValues('price');
        
        const hasFilters = selectedColors.length || selectedFabrics.length || selectedPrices.length;
        
        if (!hasFilters) {
            // No filters, show all
            this.clearFilters();
            return;
        }
        
        // Demo: Filter products based on name containing color
        const products = this.productsGrid?.querySelectorAll('.product-card');
        let visibleCount = 0;
        
        products?.forEach(product => {
            const name = product.querySelector('.product-card-name')?.textContent.toLowerCase() || '';
            const price = this.extractPrice(product.querySelector('.product-card-price')?.textContent);
            
            let matchesColor = selectedColors.length === 0 || 
                selectedColors.some(color => name.includes(color));
            
            let matchesFabric = selectedFabrics.length === 0 || 
                selectedFabrics.some(fabric => name.includes(fabric));
            
            let matchesPrice = selectedPrices.length === 0 || 
                selectedPrices.some(range => this.priceInRange(price, range));
            
            if (matchesColor && matchesFabric && matchesPrice) {
                product.style.display = '';
                visibleCount++;
            } else {
                product.style.display = 'none';
            }
        });
        
        CartManager.showNotification(`Showing ${visibleCount} products`);
    },
    
    getCheckedValues(name) {
        const checkboxes = this.filterPanel?.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checkboxes || []).map(cb => cb.value);
    },
    
    priceInRange(price, range) {
        const [min, max] = range.split('-').map(v => v === '+' ? Infinity : parseInt(v) || 0);
        if (max === undefined) return price >= min;
        return price >= min && price <= (max === Infinity ? Infinity : max);
    }
};

/**
 * Initialize wishlist heart button toggle with persistence
 */
function initWishlistButtons() {
    const wishlistBtns = document.querySelectorAll('.product-wishlist-btn');
    
    wishlistBtns.forEach(btn => {
        // Check if already in wishlist and set initial state
        const productCard = btn.closest('.product-card') || btn.closest('.wishlist-card') || btn.closest('.product-info');
        if (productCard) {
            const productId = productCard.dataset.productId;
            if (productId && WishlistManager.hasItem(productId)) {
                btn.classList.add('active');
            }
        }
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Get product data from parent card
            const card = btn.closest('.product-card') || btn.closest('.wishlist-card') || btn.closest('.product-info');
            
            if (card) {
                const product = {
                    id: card.dataset.productId || `product-${Date.now()}`,
                    name: card.dataset.productName || card.querySelector('.product-card-name, .wishlist-card-name, .product-title')?.textContent || 'Product',
                    price: parseFloat(card.dataset.productPrice) || 0,
                    image: card.dataset.productImage || card.querySelector('img')?.src || ''
                };
                
                // Toggle wishlist item
                const isAdded = WishlistManager.toggleItem(product);
                
                // Toggle visual state
                if (isAdded) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            } else {
                // Fallback: just toggle visual state
                btn.classList.toggle('active');
            }
        });
    });
    
    // Initialize wishlist badge count
    WishlistManager.updateBadge();
}

/**
 * Initialize Product Detail page functionality
 */
function initProductDetail() {
    // Accordion toggle
    const accordionHeaders = document.querySelectorAll('.product-accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordion = header.parentElement;
            const isActive = accordion.classList.contains('active');
            
            // Toggle active class
            accordion.classList.toggle('active');
            
            // Update aria-expanded
            header.setAttribute('aria-expanded', !isActive);
        });
    });

    // Thumbnail gallery
    const thumbs = document.querySelectorAll('.product-thumb');
    const mainImage = document.getElementById('mainImage');
    
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            // Update main image
            const newImageSrc = thumb.dataset.image;
            if (mainImage && newImageSrc) {
                mainImage.src = newImageSrc;
            }
            
            // Update active state
            thumbs.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    // Color swatch selection
    const colorSwatches = document.querySelectorAll('.color-swatch');
    
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            colorSwatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        });
    });

    // Add to Cart button handler
    const addToCartBtn = document.getElementById('addToCartBtn');
    const productInfo = document.querySelector('.product-info');
    
    if (addToCartBtn && productInfo) {
        addToCartBtn.addEventListener('click', () => {
            // Get product data from data attributes
            const product = {
                id: productInfo.dataset.productId,
                name: productInfo.dataset.productName,
                price: parseFloat(productInfo.dataset.productPrice),
                image: productInfo.dataset.productImage,
                quantity: 1
            };
            
            // Get selected color if any
            const selectedColor = document.querySelector('.color-swatch.active');
            if (selectedColor) {
                product.color = selectedColor.dataset.color;
            }
            
            // Add to cart using CartManager
            CartManager.addItem(product);
        });
    }
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    init();
    initProductDetail();
    // initCarouselArrows(); // Disable old arrows for Explore section if needed, but safe to leave
    if (document.querySelector('.explore-swiper')) {
        initExploreSwiper();
    }
});

// ==================== CAROUSEL ARROW NAVIGATION ====================
/**
 * Initialize carousel arrow navigation
 */
function initCarouselArrows() {
    const carouselArrows = document.querySelectorAll('.carousel-arrow');
    
    carouselArrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            const carouselId = arrow.dataset.carousel;
            const carousel = document.getElementById(carouselId);
            
            if (!carousel) return;
            
            const scrollAmount = carousel.offsetWidth * 0.8; // Scroll 80% of visible width
            const isLeft = arrow.classList.contains('carousel-arrow-left');
            
            carousel.scrollBy({
                left: isLeft ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        });
    });
}

// ==================== SCROLL REVEAL ANIMATIONS ====================
/**
 * Initialize scroll reveal animations using Intersection Observer
 * Adds elegant fade-in animations as sections enter the viewport
 */
function initScrollReveal() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // If user prefers reduced motion, show all elements immediately
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger').forEach(el => {
            el.classList.add('revealed');
        });
        return;
    }
    
    // Create Intersection Observer
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px 0px -80px 0px', // Trigger slightly before element enters viewport
        threshold: 0.1 // 10% visibility triggers animation
    };
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Optionally unobserve after revealing (performance optimization)
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all reveal elements
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger');
    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
}

// ==================== AUTO-ADD REVEAL CLASSES ====================
/**
 * Automatically add reveal classes to sections for elegant page animations
 * This runs on DOMContentLoaded to enhance the page with animations
 */
function autoAddRevealClasses() {
    // Add reveal to intro section
    const introSection = document.querySelector('.intro-section');
    if (introSection) {
        introSection.classList.add('reveal');
    }
    
    // Add reveal to discover/video section
    const discoverSection = document.querySelector('.discover-video-section');
    if (discoverSection) {
        discoverSection.classList.add('reveal');
    }
    
    // Add reveal to explore section title
    const exploreTitle = document.querySelector('.explore-title');
    if (exploreTitle) {
        exploreTitle.classList.add('reveal');
    }
    
    // Add reveal to story sections with directional animations
    const artistLegacy = document.querySelector('#artist-legacy .story-image');
    const artistContent = document.querySelector('#artist-legacy .story-content');
    if (artistLegacy) artistLegacy.classList.add('reveal-left');
    if (artistContent) artistContent.classList.add('reveal-right');
    
    const craftImage = document.querySelector('#craft-matters .story-image');
    const craftContent = document.querySelector('#craft-matters .story-content');
    if (craftImage) craftImage.classList.add('reveal-right');
    if (craftContent) craftContent.classList.add('reveal-left');
    
    // Add reveal to insights section title
    const insightsTitle = document.querySelector('.insights-title');
    if (insightsTitle) {
        insightsTitle.classList.add('reveal');
    }
    
    // Add reveal to footer
    const footer = document.querySelector('.footer-content');
    if (footer) {
        footer.classList.add('reveal');
    }
}

// Update the DOMContentLoaded event to include scroll reveal
document.addEventListener('DOMContentLoaded', () => {
    // Auto-add reveal classes first
    autoAddRevealClasses();
    
    // Initialize scroll reveal animations
    initScrollReveal();
});

// ==================== EXPLORE SWIPER ====================
function initExploreSwiper() {
    const swiper = new Swiper('.explore-swiper', {
        slidesPerView: 1, // Mobile default
        spaceBetween: 20,
        autoplay: {
            delay: 3500,
            disableOnInteraction: false,
        },
        speed: 800, // Slightly slower for more elegant scroll
        rewind: true, // "Move to 1st card again" behavior
        loop: false, // Explicitly disable loop to use rewind
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 3,
            },
            1024: {
                slidesPerView: 4, // Desktop
            },
        },
    });
}

