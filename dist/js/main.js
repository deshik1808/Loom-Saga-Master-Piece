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
let mobileMenuOpenFlag = false; // Flag to disable scroll-based header logic when mobile menu is open

function handleHeaderScroll() {
    // If mobile menu is open, do NOT update header visibility - it must stay fixed and visible
    if (mobileMenuOpenFlag) {
        return;
    }

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

    // Check if we're near the footer
    const nearFooter = currentScrollY + windowHeight >= footerTop - 50;

    // STRICT RULE: If near footer AND we have scrolled down significantly, hide header
    // The "currentScrollY > 100" check prevents hiding header on short pages (like empty wishlist) where footer is visible at top
    if (nearFooter && currentScrollY > 100) {
        if (headerVisible) {
            header.classList.add('header-hidden');
            headerVisible = false;
        }
        lastScrollY = currentScrollY;
        return;
    }

    // Scrolling up - always show header if NOT near footer
    if (currentScrollY < lastScrollY) {
        if (!headerVisible) {
            header.classList.remove('header-hidden');
            headerVisible = true;
        }
    }
    // Scrolling down
    else if (currentScrollY > lastScrollY) {
        // Hide header after scrolling 100px
        if (currentScrollY > 100) {
            if (headerVisible) {
                header.classList.add('header-hidden');
                headerVisible = false;
            }
        }
    }

    lastScrollY = currentScrollY;
}

// Listen for scroll events with throttling for performance
let ticking = false;
window.addEventListener('scroll', function () {
    if (!ticking) {
        window.requestAnimationFrame(function () {
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
        // Always ensure header is visible on page load INITIALLY
        header.classList.remove('header-hidden');
        headerVisible = true;

        // Set the scrolled class if page is already scrolled
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        }

        // Check if we are already at the footer on load (e.g. refresh)
        const footer = document.getElementById('footer');
        if (footer) {
            const footerTop = footer.offsetTop;
            const windowHeight = window.innerHeight;
            // Use same proximity logic as scroll handler WITH threshold for short pages
            if (window.scrollY + windowHeight >= footerTop - 50 && window.scrollY > 100) {
                header.classList.add('header-hidden');
                headerVisible = false;
            }
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

// ==================== FULLSCREEN MOBILE MENU (Manish Malhotra Style) ====================
/**
 * Mobile Menu Controller - Fullscreen menu with panel-based navigation
 * Now with dynamic HTML injection for global page support
 */
const MobileMenuController = {
    menu: null,
    mainPanel: null,
    hamburger: null,
    navOverlay: null,
    isOpen: false,
    currentPanel: 'main',
    panelStack: [], // Track navigation history for multi-level back nav
    level3Counter: 0, // Counter for generating unique level-3 panel IDs

    // Mobile menu HTML template (injected dynamically on pages that don't have it)
    menuHTML: `
    <div class="mobile-menu" id="mobileMenu" aria-hidden="true">
      <div class="mobile-menu__panel mobile-menu__panel--main active" id="mobileMenuMain">
        <div class="mobile-menu__content">
          <nav class="mobile-menu__nav" aria-label="Mobile Navigation">
            <ul class="mobile-menu__list">
              <li class="mobile-menu__item">
                <button class="mobile-menu__link" data-submenu="new-arrivals">
                  <span>NEW ARRIVALS</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                </button>
              </li>
              <li class="mobile-menu__item">
                <button class="mobile-menu__link" data-submenu="collection">
                  <span>COLLECTION</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                </button>
              </li>
              <li class="mobile-menu__item">
                <button class="mobile-menu__link" data-submenu="sarees">
                  <span>SAREES</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                </button>
              </li>
              <li class="mobile-menu__item">
                <button class="mobile-menu__link" data-submenu="crafts">
                  <span>CRAFTS</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                </button>
              </li>
              <li class="mobile-menu__item">
                <button class="mobile-menu__link" data-submenu="about">
                  <span>ABOUT US</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                </button>
              </li>
            </ul>
          </nav>
          <div class="mobile-menu__secondary">
            <a href="wishlist.html" class="mobile-menu__secondary-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>WISHLIST</span>
            </a>
            <a href="login.html" class="mobile-menu__secondary-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>LOG IN</span>
            </a>
          </div>
          <div class="mobile-menu__social">
            <span class="mobile-menu__social-label">Find our store</span>
            <div class="mobile-menu__social-icons">
              <a href="#" aria-label="Instagram"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
              <a href="#" aria-label="Facebook"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a href="#" aria-label="WhatsApp"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
              <a href="#" aria-label="YouTube"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg></a>
            </div>
          </div>
        </div>
      </div>
      <div class="mobile-menu__panel mobile-menu__panel--sub" id="submenu-new-arrivals" data-panel="new-arrivals">
        <div class="mobile-menu__subheader">
          <button class="mobile-menu__back" data-back="main"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M11 19l-7-7 7-7"/></svg><span>Back</span></button>
          <h2 class="mobile-menu__subtitle">NEW ARRIVALS</h2>
        </div>
        <ul class="mobile-menu__sublist">
          <li><a href="vishnupuri-silk.html">Vishnupuri Silk Sarees</a></li>
          <li><a href="#">Muslin Sarees</a></li>
        </ul>
      </div>
      <div class="mobile-menu__panel mobile-menu__panel--sub" id="submenu-collection" data-panel="collection">
        <div class="mobile-menu__subheader">
          <button class="mobile-menu__back" data-back="main"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M11 19l-7-7 7-7"/></svg><span>Back</span></button>
          <h2 class="mobile-menu__subtitle">COLLECTION</h2>
        </div>
        <ul class="mobile-menu__sublist">
          <li><a href="vishnupuri-silk.html">Vishnupuri Silk Sarees</a></li>
          <li><a href="#">Muslin Sarees</a></li>
          <li><a href="silk-sarees.html">Modal Silk Sarees</a></li>
          <li><a href="#">Matka Jamdani Sarees</a></li>
          <li><a href="#">Tussar Jamdani Sarees</a></li>
          <li><a href="collections.html">View All</a></li>
        </ul>
      </div>
      <div class="mobile-menu__panel mobile-menu__panel--sub" id="submenu-sarees" data-panel="sarees">
        <div class="mobile-menu__subheader">
          <button class="mobile-menu__back" data-back="main"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M11 19l-7-7 7-7"/></svg><span>Back</span></button>
          <h2 class="mobile-menu__subtitle">SAREES</h2>
        </div>
        <div class="mobile-menu__subgroup">
          <h3 class="mobile-menu__subgroup-title">Shop By Fabric</h3>
          <ul class="mobile-menu__sublist">
            <li><a href="silk-sarees.html">Silk</a></li>
            <li><a href="#">Tissue Silk</a></li>
            <li><a href="#">Lenin</a></li>
            <li><a href="#">Cotton</a></li>
          </ul>
        </div>
        <div class="mobile-menu__subgroup">
          <h3 class="mobile-menu__subgroup-title">Shop By Craft</h3>
          <ul class="mobile-menu__sublist">
            <li><a href="#">Zari Weaving</a></li>
            <li><a href="#">Ikat</a></li>
            <li><a href="#">Handloom Weaving</a></li>
            <li><a href="#">Kalamkari</a></li>
          </ul>
        </div>
        <a href="collections.html" class="mobile-menu__view-all">VIEW ALL SAREES</a>
      </div>
      <div class="mobile-menu__panel mobile-menu__panel--sub" id="submenu-crafts" data-panel="crafts">
        <div class="mobile-menu__subheader">
          <button class="mobile-menu__back" data-back="main"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M11 19l-7-7 7-7"/></svg><span>Back</span></button>
          <h2 class="mobile-menu__subtitle">CRAFTS</h2>
        </div>
        <div class="mobile-menu__subgroup">
          <h3 class="mobile-menu__subgroup-title">Handloom</h3>
          <ul class="mobile-menu__sublist">
            <li><a href="handloom.html#fabrics">Fabrics</a></li>
            <li><a href="handloom.html#weaving">Weaving Process</a></li>
            <li><a href="handloom.html#techniques">Techniques & Patterns</a></li>
          </ul>
        </div>
        <div class="mobile-menu__subgroup">
          <h3 class="mobile-menu__subgroup-title">Fashion Insights</h3>
          <ul class="mobile-menu__sublist">
            <li><a href="fashion-insights.html">Indo-Western Style</a></li>
            <li><a href="fashion-insights.html">Draped for the Day</a></li>
          </ul>
        </div>
      </div>
      <div class="mobile-menu__panel mobile-menu__panel--sub" id="submenu-about" data-panel="about">
        <div class="mobile-menu__subheader">
          <button class="mobile-menu__back" data-back="main"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M11 19l-7-7 7-7"/></svg><span>Back</span></button>
          <h2 class="mobile-menu__subtitle">ABOUT US</h2>
        </div>
        <ul class="mobile-menu__sublist">
          <li><a href="brand-story.html">Our Brand Story</a></li>
          <li><a href="about.html">Our Founder's Story</a></li>
          <li><a href="#">Our Store</a></li>
          <li><a href="#">FAQ's</a></li>
          <li><a href="contact.html">Contact Us</a></li>
        </ul>
      </div>
    </div>`,

    init() {
        this.hamburger = document.getElementById('hamburger');

        // Exit early if hamburger doesn't exist (not a standard page)
        if (!this.hamburger) {
            console.debug('[MobileMenuController] No hamburger found, skipping init');
            return;
        }

        // Ensure nav overlay exists, create if missing
        this.navOverlay = document.getElementById('navOverlay');
        if (!this.navOverlay) {
            this.injectNavOverlay();
            this.navOverlay = document.getElementById('navOverlay');
        }

        // Check if mobile menu exists, if not inject it
        this.menu = document.getElementById('mobileMenu');
        if (!this.menu) {
            this.injectMobileMenu();
            this.menu = document.getElementById('mobileMenu');
        }

        // Final safety check
        if (!this.menu) {
            console.warn('[MobileMenuController] Failed to initialize mobile menu');
            return;
        }

        this.mainPanel = document.getElementById('mobileMenuMain');

        // Transform subgroups into level-3 panel navigation (BEFORE binding events)
        this.transformSubgroupsToLevel3Panels();

        this.bindEvents();

        console.debug('[MobileMenuController] Initialized successfully');
    },

    injectNavOverlay() {
        // Create nav overlay if it doesn't exist
        const header = document.getElementById('header') || document.querySelector('.header');
        if (header) {
            header.insertAdjacentHTML('afterend', '<div class="nav-overlay" id="navOverlay"></div>');
        }
    },

    injectMobileMenu() {
        // Find the best insertion point - after nav overlay if it exists, else after header
        const navOverlay = document.getElementById('navOverlay');
        const header = document.getElementById('header') || document.querySelector('.header');

        if (navOverlay) {
            navOverlay.insertAdjacentHTML('afterend', this.menuHTML);
        } else if (header) {
            header.insertAdjacentHTML('afterend', this.menuHTML);
        } else {
            // Fallback: insert at beginning of body
            document.body.insertAdjacentHTML('afterbegin', this.menuHTML);
        }
    },

    bindEvents() {
        // Hamburger toggle - safe event binding
        if (this.hamburger) {
            this.hamburger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            });
        }

        // Overlay click to close
        if (this.navOverlay) {
            this.navOverlay.addEventListener('click', () => this.close());
        }

        // Sub-menu navigation buttons (safely query within menu)
        if (this.menu) {
            this.menu.querySelectorAll('[data-submenu]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const submenuId = e.currentTarget.dataset.submenu;
                    this.showSubPanel(submenuId);
                });
            });

            // Back buttons (level-2 to main)
            this.menu.querySelectorAll('[data-back]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.goBackOneLevel();
                });
            });

            // Level-3 navigation buttons (use event delegation for dynamic buttons)
            this.menu.addEventListener('click', (e) => {
                const level3Btn = e.target.closest('[data-level3]');
                if (level3Btn) {
                    e.preventDefault();
                    const panelId = level3Btn.dataset.level3;
                    this.showLevel3Panel(panelId);
                }

                // Level-3 back buttons
                const backLevel3Btn = e.target.closest('[data-back-level3]');
                if (backLevel3Btn) {
                    e.preventDefault();
                    this.goBackOneLevel();
                }
            });
        }

        // Close on window resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && this.isOpen) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    open() {
        if (!this.menu || !this.hamburger) return;

        this.isOpen = true;

        // CRITICAL FIX: Force header visible and lock scroll-based hide/show
        mobileMenuOpenFlag = true;
        const headerEl = document.getElementById('header');
        if (headerEl) {
            // Force header to be visible - remove any hide transforms
            headerEl.classList.remove('header-hidden');
            headerEl.classList.add('mobile-menu-active');
            headerVisible = true;
        }

        this.menu.classList.add('active');
        this.menu.setAttribute('aria-hidden', 'false');
        this.hamburger.classList.add('active');
        this.hamburger.setAttribute('aria-expanded', 'true');
        if (this.navOverlay) this.navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Ensure main panel is active
        this.showMainPanel();
    },

    close() {
        if (!this.menu || !this.hamburger) return;

        this.isOpen = false;

        // CRITICAL FIX: Unlock scroll-based header behavior
        mobileMenuOpenFlag = false;
        const headerEl = document.getElementById('header');
        if (headerEl) {
            headerEl.classList.remove('mobile-menu-active');
            // Update lastScrollY to current position to prevent sudden hide on next scroll
            lastScrollY = window.scrollY;
        }

        this.menu.classList.remove('active');
        this.menu.setAttribute('aria-hidden', 'true');
        this.hamburger.classList.remove('active');
        this.hamburger.setAttribute('aria-expanded', 'false');
        if (this.navOverlay) this.navOverlay.classList.remove('active');
        document.body.style.overflow = '';

        // Reset to main panel after close animation
        setTimeout(() => {
            if (!this.isOpen) {
                this.resetPanels();
            }
        }, 350);
    },

    showMainPanel() {
        if (!this.menu) return;

        this.currentPanel = 'main';
        // Hide all sub-panels
        this.menu.querySelectorAll('.mobile-menu__panel--sub').forEach(panel => {
            panel.classList.remove('active');
        });
        // Show main panel
        if (this.mainPanel) {
            this.mainPanel.classList.add('active');
        }
    },

    showSubPanel(submenuId) {
        if (!this.menu) return;

        // Push current panel to stack for back navigation
        this.panelStack.push(this.currentPanel);
        this.currentPanel = submenuId;

        // Clear all panel states first
        this.menu.querySelectorAll('.mobile-menu__panel').forEach(panel => {
            panel.classList.remove('active', 'panel-underneath');
        });

        // Keep main panel visible underneath (for smooth back reveal)
        if (this.mainPanel) {
            this.mainPanel.classList.add('panel-underneath');
        }

        // Show target sub-panel on top
        const subPanel = document.getElementById(`submenu-${submenuId}`);
        if (subPanel) {
            subPanel.classList.add('active');
        }
    },

    resetPanels() {
        if (!this.menu) return;

        // Reset all panels to initial state
        this.menu.querySelectorAll('.mobile-menu__panel').forEach(panel => {
            panel.classList.remove('active');
        });
        if (this.mainPanel) {
            this.mainPanel.classList.add('active');
        }
        this.currentPanel = 'main';
        this.panelStack = []; // Clear navigation history
    },

    /**
     * Transform subgroups into level-3 panel navigation
     * Converts inline subgroup content to dedicated clickable panels
     */
    transformSubgroupsToLevel3Panels() {
        if (!this.menu) return;

        // Find all level-2 panels that contain subgroups
        const level2Panels = this.menu.querySelectorAll('.mobile-menu__panel--sub');

        level2Panels.forEach(level2Panel => {
            const subgroups = level2Panel.querySelectorAll('.mobile-menu__subgroup');
            if (subgroups.length === 0) return; // No subgroups to transform

            const parentPanelId = level2Panel.dataset.panel || level2Panel.id.replace('submenu-', '');

            subgroups.forEach(subgroup => {
                const titleEl = subgroup.querySelector('.mobile-menu__subgroup-title');
                const sublist = subgroup.querySelector('.mobile-menu__sublist');

                if (!titleEl || !sublist) return;

                const title = titleEl.textContent.trim();
                const panelId = `level3-${parentPanelId}-${this.level3Counter++}`;

                // Clone the sublist content for the new panel
                const sublistContent = sublist.cloneNode(true);

                // Generate level-3 panel
                this.generateLevel3Panel(panelId, title, parentPanelId, sublistContent);

                // Replace the subgroup with a navigation button
                const navButton = document.createElement('button');
                navButton.className = 'mobile-menu__link mobile-menu__subgroup-btn';
                navButton.dataset.level3 = panelId;
                navButton.dataset.parent = parentPanelId;
                navButton.innerHTML = `
                    <span>${title}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
                `;

                // Create wrapper li for proper list flow
                const listItem = document.createElement('li');
                listItem.className = 'mobile-menu__item';
                listItem.appendChild(navButton);

                // Replace subgroup with the button
                subgroup.replaceWith(listItem);
            });

            // Wrap existing items in a ul if not already
            const existingItems = level2Panel.querySelectorAll('.mobile-menu__item');
            if (existingItems.length > 0) {
                const existingList = level2Panel.querySelector('.mobile-menu__sublist, .mobile-menu__list');
                if (!existingList) {
                    const ul = document.createElement('ul');
                    ul.className = 'mobile-menu__list';
                    existingItems.forEach(item => ul.appendChild(item));
                    const subheader = level2Panel.querySelector('.mobile-menu__subheader');
                    if (subheader) {
                        subheader.insertAdjacentElement('afterend', ul);
                    }
                }
            }
        });

        console.debug('[MobileMenuController] Transformed subgroups to level-3 panels');
    },

    /**
     * Generate a new level-3 panel and inject it into the menu
     */
    generateLevel3Panel(panelId, title, parentPanelId, content) {
        const panel = document.createElement('div');
        panel.className = 'mobile-menu__panel mobile-menu__panel--sub mobile-menu__panel--level3';
        panel.id = panelId;
        panel.dataset.panel = panelId;
        panel.dataset.parent = parentPanelId;

        panel.innerHTML = `
            <div class="mobile-menu__subheader">
                <button class="mobile-menu__back" data-back-level3="${parentPanelId}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M11 19l-7-7 7-7"/></svg>
                    <span>Back</span>
                </button>
                <h2 class="mobile-menu__subtitle">${title.toUpperCase()}</h2>
            </div>
        `;

        // Append the content (sublist)
        panel.appendChild(content);

        // Inject into mobile menu container
        this.menu.appendChild(panel);
    },

    /**
     * Show a level-3 panel and hide the parent
     */
    showLevel3Panel(panelId) {
        if (!this.menu) return;

        const targetPanel = document.getElementById(panelId);
        if (!targetPanel) return;

        // Get parent panel ID from data attribute
        const parentPanelId = targetPanel.dataset.parent;

        // Push current panel to stack for back navigation
        this.panelStack.push(this.currentPanel);
        this.currentPanel = panelId;

        // Clear all panel states first
        this.menu.querySelectorAll('.mobile-menu__panel').forEach(panel => {
            panel.classList.remove('active', 'panel-underneath');
        });

        // Keep main panel visible at bottom
        if (this.mainPanel) {
            this.mainPanel.classList.add('panel-underneath');
        }

        // Keep parent level-2 panel visible underneath level-3
        if (parentPanelId) {
            const parentPanel = document.getElementById(`submenu-${parentPanelId}`);
            if (parentPanel) {
                parentPanel.classList.add('panel-underneath');
            }
        }

        // Show target level-3 panel on top
        targetPanel.classList.add('active');
    },

    /**
     * Go back one level in the navigation stack
     * Uses reveal animation - current panel slides away, revealing parent underneath
     */
    goBackOneLevel() {
        if (this.panelStack.length === 0) {
            this.showMainPanel();
            return;
        }

        const currentPanelId = this.currentPanel;
        const previousPanel = this.panelStack.pop();
        this.currentPanel = previousPanel;

        // Get the current panel element
        const currentPanelEl = document.getElementById(currentPanelId) ||
            document.getElementById(`submenu-${currentPanelId}`);

        // Remove active from current panel (triggers slide-out animation)
        if (currentPanelEl) {
            currentPanelEl.classList.remove('active');
        }

        // Show previous panel (it should already be visible as panel-underneath)
        if (previousPanel === 'main') {
            // Clear all panel-underneath classes and show main as active
            this.menu.querySelectorAll('.mobile-menu__panel').forEach(panel => {
                panel.classList.remove('panel-underneath');
            });
            if (this.mainPanel) {
                this.mainPanel.classList.add('active');
            }
        } else {
            // Promote the parent panel from underneath to active
            const parentPanel = document.getElementById(`submenu-${previousPanel}`) ||
                document.getElementById(previousPanel);
            if (parentPanel) {
                parentPanel.classList.remove('panel-underneath');
                parentPanel.classList.add('active');
            }
            // Keep main visible underneath if we're still at level-2
            if (this.mainPanel) {
                this.mainPanel.classList.add('panel-underneath');
            }
        }
    }
};

// Initialize mobile menu controller on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileMenuController.init());
} else {
    MobileMenuController.init();
}

// Legacy function wrappers for backward compatibility
function toggleMobileNav() {
    MobileMenuController.toggle();
}

function closeMobileNav() {
    MobileMenuController.close();
}

// ==================== PREMIUM SEARCH OVERLAY (Manish Malhotra Style) ====================
/**
 * Search Overlay Manager - Premium top-bar search with two-column results
 * Features: slide-down overlay, suggestions + products layout, horizontal cards
 */
const SearchOverlayManager = {
    overlay: null,
    panel: null,
    input: null,
    clearBtn: null,
    closeBtn: null,
    backdrop: null,
    resultsContainer: null,
    suggestionList: null,
    productList: null,
    popularSection: null,
    noResults: null,
    debounceTimer: null,

    // Fallback product data (used only when ProductService is not available)
    _fallbackProducts: [
        { id: 'LS-VSK-001', name: 'Lime Green Hand-printed Vishnupuri Silk Saree', price: 5199, image: 'https://placehold.co/140x180/9acd32/333', url: 'product-detail.html', category: 'Vishnupuri' },
        { id: 'LS-VSK-002', name: 'Mustard Yellow Vishnupuri Silk Saree', price: 5199, image: 'https://placehold.co/140x180/d4a017/333', url: 'product-detail.html', category: 'Vishnupuri' },
        { id: 'LS-VSK-003', name: 'Red Vishnupuri Silk Saree with Zari Border', price: 5499, image: 'https://placehold.co/140x180/c41e3a/fff', url: 'product-detail.html', category: 'Vishnupuri' },
        { id: 'LS-SLK-001', name: 'Royal Blue Tussar Silk Saree', price: 6499, image: 'https://placehold.co/140x180/4169e1/fff', url: 'product-detail.html', category: 'Silk Sarees' },
        { id: 'LS-SLK-002', name: 'Ivory White Modal Silk Saree', price: 4599, image: 'https://placehold.co/140x180/fffff0/333', url: 'product-detail.html', category: 'Silk Sarees' },
        { id: 'LS-HLM-001', name: 'Traditional Handloom Cotton Saree', price: 3999, image: 'https://placehold.co/140x180/f5deb3/333', url: 'product-detail.html', category: 'Handloom' },
        { id: 'LS-HLM-002', name: 'Hand-woven Jamdani Saree', price: 4299, image: 'https://placehold.co/140x180/dda0dd/333', url: 'product-detail.html', category: 'Handloom' },
        { id: 'LS-WED-001', name: 'Bridal Red Banarasi Silk Saree', price: 12999, image: 'https://placehold.co/140x180/8b0000/fff', url: 'product-detail.html', category: 'Wedding' },
    ],

    // Dynamically get products from ProductService (live WooCommerce data) or fallback
    get products() {
        if (window.ProductService && window.ProductService.getProductCount && window.ProductService.getProductCount() > 0) {
            return window.ProductService.getAllProducts().map(function (p) {
                return {
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    image: p.primaryImage || p.images?.[0] || 'https://placehold.co/140x180/e0e0e0/666?text=No+Image',
                    url: 'product-detail.html?id=' + p.id,
                    category: p.category || 'Uncategorized'
                };
            });
        }
        return this._fallbackProducts;
    },

    // Category suggestions mapping
    categories: [
        { name: 'Silk Sarees', url: 'silk-sarees.html' },
        { name: 'Vishnupuri Collection', url: 'vishnupuri-silk.html' },
        { name: 'Handloom Sarees', url: 'handloom.html' },
        { name: 'Wedding Collection', url: 'collections.html' },
        { name: 'New Arrivals', url: 'collections.html' },
    ],

    init() {
        this.overlay = document.getElementById('searchOverlay');
        this.panel = this.overlay?.querySelector('.search-overlay__panel');
        this.input = document.getElementById('searchOverlayInput');
        this.clearBtn = document.getElementById('searchOverlayClear');
        this.closeBtn = document.getElementById('searchOverlayClose');
        this.backdrop = document.getElementById('searchBackdrop');
        this.resultsContainer = document.getElementById('searchOverlayResults');
        this.suggestionList = document.getElementById('suggestionList');
        this.productList = document.getElementById('productList');
        this.popularSection = this.overlay?.querySelector('.search-overlay__popular');
        this.noResults = document.getElementById('searchNoResults');

        if (!this.overlay) return;

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

        // Close on backdrop click
        if (this.backdrop) {
            this.backdrop.addEventListener('click', () => this.close());
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay?.classList.contains('active')) {
                this.close();
            }
        });

        // Live search on input
        if (this.input) {
            this.input.addEventListener('input', (e) => {
                const value = e.target.value;

                // Toggle clear button visibility
                if (this.clearBtn) {
                    this.clearBtn.style.display = value.length > 0 ? 'flex' : 'none';
                }

                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.search(value);
                }, 250);
            });
        }

        // Clear button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.input.value = '';
                this.clearBtn.style.display = 'none';
                this.showInitialState();
                this.input.focus();
            });
        }
    },

    open() {
        this.overlay.classList.add('active');
        this.overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus input after animation
        setTimeout(() => {
            this.input?.focus();
        }, 300);
    },

    close() {
        this.overlay.classList.remove('active');
        this.overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Reset state
        if (this.input) this.input.value = '';
        if (this.clearBtn) this.clearBtn.style.display = 'none';
        this.showInitialState();
    },

    showInitialState() {
        if (this.resultsContainer) this.resultsContainer.style.display = 'none';
        if (this.popularSection) this.popularSection.style.display = 'block';
        if (this.noResults) this.noResults.style.display = 'none';
    },

    showResults() {
        if (this.resultsContainer) this.resultsContainer.style.display = 'grid';
        if (this.popularSection) this.popularSection.style.display = 'none';
        if (this.noResults) this.noResults.style.display = 'none';
    },

    showNoResults() {
        if (this.resultsContainer) this.resultsContainer.style.display = 'none';
        if (this.popularSection) this.popularSection.style.display = 'none';
        if (this.noResults) this.noResults.style.display = 'block';
    },

    search(query) {
        const trimmedQuery = query.trim().toLowerCase();

        if (trimmedQuery.length < 2) {
            this.showInitialState();
            return;
        }

        // Filter products
        const matchedProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(trimmedQuery) ||
            product.category.toLowerCase().includes(trimmedQuery)
        );

        // Filter matching categories for suggestions
        const matchedCategories = this.categories.filter(cat =>
            cat.name.toLowerCase().includes(trimmedQuery)
        );

        if (matchedProducts.length > 0 || matchedCategories.length > 0) {
            this.showResults();
            this.renderSuggestions(matchedCategories, trimmedQuery);
            this.renderProducts(matchedProducts, trimmedQuery);
        } else {
            this.showNoResults();
        }
    },

    renderSuggestions(categories, query) {
        if (!this.suggestionList) return;

        // If no category matches, show generic suggestion
        if (categories.length === 0) {
            this.suggestionList.innerHTML = `
                <li class="search-overlay__suggestion-item">
                    <a href="silk-sarees.html?q=${encodeURIComponent(query)}" class="search-overlay__suggestion-link">
                        Search for "${query}"
                    </a>
                </li>
            `;
            return;
        }

        this.suggestionList.innerHTML = categories.map(cat => `
            <li class="search-overlay__suggestion-item">
                <a href="${cat.url}" class="search-overlay__suggestion-link">${cat.name}</a>
            </li>
        `).join('');
    },

    renderProducts(products, query) {
        if (!this.productList) return;

        if (products.length === 0) {
            this.productList.innerHTML = '<p class="search-overlay__no-products">No products found</p>';
            return;
        }

        // Show max 5 products in dropdown
        const displayProducts = products.slice(0, 5);

        this.productList.innerHTML = displayProducts.map(product => {
            var imgSrc = product.image;
            var regularPrice = Number(product.regularPrice) || 0;
            var salePrice = Number(product.salePrice) || 0;
            var hasSale = salePrice > 0 && regularPrice > salePrice;
            var currentPrice = hasSale ? salePrice : (Number(product.price) || 0);
            // Use ProductRenderer image optimization if available
            if (window.ProductRenderer && window.ProductRenderer.getOptimizedImage) {
                imgSrc = window.ProductRenderer.getOptimizedImage(product.image, 200);
            }
            return `
            <a href="${product.url}" class="search-overlay__product-card">
                <img src="${imgSrc}" alt="${product.name}" class="search-overlay__product-image" loading="lazy">
                <div class="search-overlay__product-info">
                    <div class="search-overlay__product-name">${this.highlightMatch(product.name, query)}</div>
                    <div class="search-overlay__product-price">
                      ${hasSale ? `<span class="search-overlay__product-price-regular">Rs.${regularPrice.toLocaleString('en-IN')}/-</span>` : ''}
                      <span class="search-overlay__product-price-current${hasSale ? ' search-overlay__product-price-current--sale' : ''}">Rs.${currentPrice.toLocaleString('en-IN')}/-</span>
                    </div>
                </div>
            </a>
        `;
        }).join('');
    },

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
};

// Legacy aliases for backwards compatibility
const AtelierSearchManager = SearchOverlayManager;
const SearchManager = SearchOverlayManager;

// Initialize search overlay manager
SearchOverlayManager.init();


// Note: Hamburger and overlay events are handled by MobileMenuController
// Legacy handlers removed to prevent duplicate listeners

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
        // Disabled to prevent layout jumping/z-index issues on cart page
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
        // Disabled
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
        this.renderDrawer();
    },

    /**
     * Add item to cart
     * Respects stockQuantity — will not add beyond available stock.
     * @param {Object} product - Product object with id, name, price, image, stockQuantity
     * @returns {{ success: boolean, message: string }}
     */
    addItem(product) {
        const items = this.getItems();
        const existingIndex = items.findIndex(item => String(item.id) === String(product.id));

        const currentQty = existingIndex > -1 ? items[existingIndex].quantity : 0;
        const maxStock = product.stockQuantity ?? null; // null = unlimited

        // Stock-limit guard
        if (maxStock !== null && currentQty >= maxStock) {
            this.showNotification(
                maxStock === 0
                    ? `${product.name} is out of stock`
                    : `Maximum available quantity (${maxStock}) already in cart`
            );
            return { success: false, message: 'Stock limit reached' };
        }

        if (existingIndex > -1) {
            // Increase quantity if item exists
            items[existingIndex].quantity += 1;
            // Keep stockQuantity up-to-date in the cart entry
            items[existingIndex].stockQuantity = maxStock;
        } else {
            // Add new item with quantity 1
            items.push({
                ...product,
                quantity: 1,
                stockQuantity: maxStock
            });
        }

        this.saveItems(items);
        this.showNotification(`${product.name} added to cart`);
        return { success: true, message: 'Added' };
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
     * Update item quantity (respects stock limits)
     * @param {string} productId - Product ID
     * @param {number} quantity - Desired new quantity
     * @returns {{ success: boolean, message: string }}
     */
    updateQuantity(productId, quantity) {
        const items = this.getItems();
        const itemIndex = items.findIndex(item => String(item.id) === String(productId));

        if (itemIndex > -1) {
            const maxStock = items[itemIndex].stockQuantity ?? null;

            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                items.splice(itemIndex, 1);
            } else if (maxStock !== null && quantity > maxStock) {
                // Cap at stock limit
                this.showNotification(`Only ${maxStock} available`);
                items[itemIndex].quantity = maxStock;
            } else {
                items[itemIndex].quantity = quantity;
            }
        }

        this.saveItems(items);
        this.renderCart();
        return { success: true, message: 'Updated' };
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
                <div class="cart-item-product">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <p class="cart-item-price">${this.formatPrice(item.price)}</p>
                        <div class="cart-item-meta">
                            <span>Color: ${item.color || 'Not specified'}</span>
                            <span>Style: ${item.style || 'None'}</span>
                        </div>
                    </div>
                </div>
                <div class="cart-item-quantity">
                    <div class="quantity-control">
                        <button class="quantity-btn quantity-minus" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn quantity-plus" data-id="${item.id}" aria-label="Increase quantity"${item.stockQuantity != null && item.quantity >= item.stockQuantity ? ' disabled title="Stock limit reached"' : ''}>+</button>
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
    /**
     * Initialize Drawer
     */
    initDrawer() {
        const trigger = document.getElementById('cartTriggerBtn');
        const drawer = document.getElementById('cartDrawer');
        const closeBtn = document.getElementById('drawerClose');
        const overlay = document.getElementById('cartOverlay');

        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.openDrawer();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDrawer());
        }

        if (overlay) {
            overlay.addEventListener('click', () => this.closeDrawer());
        }
    },

    openDrawer() {
        document.getElementById('cartDrawer')?.classList.add('active');
        document.getElementById('cartOverlay')?.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        this.renderDrawer();
    },

    closeDrawer() {
        document.getElementById('cartDrawer')?.classList.remove('active');
        document.getElementById('cartOverlay')?.classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * Render Drawer Items
     */
    renderDrawer() {
        const drawerItemsEl = document.getElementById('cartDrawerItems');
        const drawerTotalEl = document.getElementById('drawerTotalAmount');
        if (!drawerItemsEl) return;

        const items = this.getItems();

        // Elements to toggle
        const drawerSubheader = document.querySelector('.cart-drawer-subheader');
        const drawerFooter = document.getElementById('cartDrawerFooter');
        const drawerEmpty = document.getElementById('cartDrawerEmpty');

        if (items.length === 0) {
            // Show new Empty State
            if (drawerItemsEl) drawerItemsEl.style.display = 'none';
            if (drawerSubheader) drawerSubheader.style.display = 'none';
            if (drawerFooter) drawerFooter.style.display = 'none';

            if (drawerEmpty) {
                drawerEmpty.style.display = 'flex';
            } else {
                // Fallback if empty state container is missing
                drawerItemsEl.style.display = 'block';
                drawerItemsEl.innerHTML = '<div class="search-no-results" style="padding: 20px; text-align: center;">Your cart is empty</div>';
            }

            if (drawerTotalEl) drawerTotalEl.textContent = this.formatPrice(0);
            return;
        }

        // Hide Empty State, Show Content
        if (drawerItemsEl) drawerItemsEl.style.display = 'block';
        if (drawerSubheader) drawerSubheader.style.display = 'flex';
        if (drawerFooter) drawerFooter.style.display = 'block';
        if (drawerEmpty) drawerEmpty.style.display = 'none';

        drawerItemsEl.innerHTML = items.map(item => `
            <div class="drawer-item">
                <img src="${item.image}" alt="${item.name}" class="drawer-item-image">
                <div class="drawer-item-details">
                    <h4 class="drawer-item-name">${item.name}</h4>
                    <p class="drawer-item-price">${this.formatPrice(item.price)}</p>
                    <div class="drawer-item-meta">
                        Size: ${item.style && item.style !== 'None' ? item.style : 'S'} <br>
                        Color: ${item.color || 'Default'}
                    </div>
                    
                    <div class="drawer-item-actions">
                         <div class="drawer-quantity">
                            <button class="drawer-qty-btn drawer-minus" data-id="${item.id}">−</button>
                            <span class="drawer-qty-val">${item.quantity}</span>
                            <button class="drawer-qty-btn drawer-plus" data-id="${item.id}"${item.stockQuantity != null && item.quantity >= item.stockQuantity ? ' disabled title="Stock limit reached"' : ''}>+</button>
                        </div>
                        <button class="drawer-remove-btn" data-id="${item.id}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        if (drawerTotalEl) {
            drawerTotalEl.textContent = this.formatPrice(this.getTotal());
        }

        this.bindDrawerItemEvents();
    },

    bindDrawerItemEvents() {
        document.querySelectorAll('.drawer-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const items = this.getItems();
                const item = items.find(i => i.id === id);
                if (item) this.updateQuantity(id, item.quantity - 1);
            });
        });

        document.querySelectorAll('.drawer-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const item = this.getItems().find(i => i.id === id);
                if (item) this.updateQuantity(id, item.quantity + 1);
            });
        });

        document.querySelectorAll('.drawer-remove-btn').forEach(btn => {
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
    },

    init() {
        this.initDrawer();
        this.updateBadge();
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
                regularPrice: product.regularPrice || 0,
                salePrice: product.salePrice || 0,
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
    },

    /**
     * Remove duplicate items from wishlist based on product ID
     * This cleans up any existing duplicates that may have been added before the fix
     * Note: Uses ID, not name, because different products may have similar display names
     */
    removeDuplicates() {
        const items = this.getItems();
        const seenIds = new Set();
        const uniqueItems = [];

        for (const item of items) {
            // Use product ID for deduplication (not name, since different products can have similar names)
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                uniqueItems.push(item);
            }
        }

        // Only save if duplicates were found
        if (uniqueItems.length !== items.length) {
            console.log(`Wishlist cleanup: Removed ${items.length - uniqueItems.length} duplicate(s)`);
            this.saveItems(uniqueItems);
        }

        return uniqueItems;
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

        // Clean up any duplicate items that may exist from before the fix
        WishlistManager.removeDuplicates();

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
        wishlistGrid.innerHTML = pageItems.map(item => {
            const regularPrice = Number(item.regularPrice) || 0;
            const salePrice = Number(item.salePrice) || 0;
            const hasSale = salePrice > 0 && regularPrice > salePrice;
            const currentPrice = Number(item.price) || 0;

            return `
            <article class="wishlist-card" data-product-id="${item.id}" data-product-name="${item.name}" data-product-price="${currentPrice}" data-product-regular-price="${regularPrice}" data-product-sale-price="${salePrice}" data-product-image="${item.image}">
                <a href="product-detail.html" class="wishlist-card-link">
                    <div class="wishlist-card-image">
                        <img src="${item.image}" alt="${item.name}" loading="lazy">
                        <button class="wishlist-remove-btn active" aria-label="Remove from Wishlist" data-id="${item.id}">
                            <img src="assets/icons/heart-filled.png" alt="" class="heart-filled">
                        </button>
                    </div>
                    <div class="wishlist-card-info">
                        <h2 class="wishlist-card-name">${item.name}</h2>
                        <p class="wishlist-card-price">
                          ${hasSale ? `<span class="wishlist-card-price-regular">Rs.${regularPrice.toLocaleString('en-IN')}/-</span>` : ''}
                          <span class="wishlist-card-price-current${hasSale ? ' wishlist-card-price-current--sale' : ''}">Rs.${currentPrice.toLocaleString('en-IN')}/-</span>
                        </p>
                    </div>
                </a>
                <button class="wishlist-add-btn" data-id="${item.id}">Add To Bag</button>
            </article>
        `;
        }).join('');

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
/**
 * Initialize Checkout Process
 * Connects the local cart to the WordPress/WooCommerce checkout
 */
function initCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const items = CartManager.getItems();
            if (items.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            // Show loading state on button
            const originalText = checkoutBtn.textContent;
            checkoutBtn.textContent = 'PREPARING CHECKOUT...';
            checkoutBtn.style.pointerEvents = 'none';
            checkoutBtn.style.opacity = '0.7';

            try {
                // Call our serverless function to get the secure checkout URL
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ items })
                });

                const data = await response.json();

                if (data.url) {
                    // Redirect to WordPress Checkout
                    window.location.href = data.url;
                } else {
                    throw new Error(data.error || 'Failed to get checkout URL');
                }
            } catch (error) {
                console.error('Checkout Error:', error);
                alert('Sorry, we encountered an issue redirecting to checkout. Please try again.');

                // Reset button state
                checkoutBtn.textContent = originalText;
                checkoutBtn.style.pointerEvents = 'auto';
                checkoutBtn.style.opacity = '1';
            }
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
    window.addDemoProduct = function () {
        CartManager.addItem({
            id: 'saree-001',
            name: 'Lime Green Hand Printed Vishnupuri Silk',
            price: 5199,
            image: 'https://placehold.co/300x400/a8c8b0/333333?text=Saree',
            color: 'Lime Green',
            style: 'None'
        });
    };

    window.addDemoProduct2 = function () {
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
    articlesPerPage: 9,
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

    // Initialize footer accordion
    if (typeof MobileFooterAccordion !== 'undefined') {
        MobileFooterAccordion.init();
    }

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
        this.productsGrid = document.querySelector('.products-grid') || document.querySelector('.collections-grid');

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

        const products = Array.from(this.productsGrid.querySelectorAll('.product-card, .collection-card'));

        products.sort((a, b) => {
            const nameA = a.querySelector('.product-card-name, .collection-card-name')?.textContent || '';
            const nameB = b.querySelector('.product-card-name, .collection-card-name')?.textContent || '';
            const priceA = this.extractPrice(a.querySelector('.product-card-price'));
            const priceB = this.extractPrice(b.querySelector('.product-card-price'));

            switch (sortType) {
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

    extractPrice(priceSource) {
        if (!priceSource) return 0;

        // Prefer the explicit current/sale node when available.
        if (typeof priceSource !== 'string') {
            const activePrice =
                priceSource.querySelector('.product-card-price-current')?.textContent ||
                priceSource.textContent ||
                '';
            return parseInt(activePrice.replace(/[^0-9]/g, '')) || 0;
        }

        return parseInt(priceSource.replace(/[^0-9]/g, '')) || 0;
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
            const price = this.extractPrice(product.querySelector('.product-card-price'));

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
                // Get product name first for stable ID generation
                const productName = card.dataset.productName || card.querySelector('.product-card-name, .wishlist-card-name, .product-title')?.textContent || 'Product';

                // Generate stable ID from product name if data-product-id is missing
                // This prevents duplicates by ensuring the same product always has the same ID
                const generateStableId = (name) => {
                    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 50);
                    return `product-${cleanName}`;
                };

                const product = {
                    id: card.dataset.productId || generateStableId(productName),
                    name: productName,
                    price: parseFloat(card.dataset.productPrice) || 0,
                    regularPrice: parseFloat(card.dataset.productRegularPrice) || 0,
                    salePrice: parseFloat(card.dataset.productSalePrice) || 0,
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

    // ==================== STACKED GALLERY LIGHTBOX ====================
    const lightbox = document.getElementById('productLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxCounter = document.getElementById('lightboxCounter');

    // Get all gallery images (stacked layout)
    const galleryImages = document.querySelectorAll('.gallery-image');

    if (!lightbox || galleryImages.length === 0) return;

    // Collect all image sources
    const imageSources = Array.from(galleryImages).map(container => {
        const img = container.querySelector('img');
        return img ? img.src : '';
    }).filter(src => src);

    let currentImageIndex = 0;

    // Open lightbox
    function openLightbox(index = 0) {
        currentImageIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Update lightbox image and counter
    function updateLightboxImage() {
        if (lightboxImage && imageSources[currentImageIndex]) {
            lightboxImage.src = imageSources[currentImageIndex];
        }
        if (lightboxCounter) {
            lightboxCounter.textContent = `${currentImageIndex + 1} / ${imageSources.length}`;
        }
    }

    // Navigate to previous image
    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + imageSources.length) % imageSources.length;
        updateLightboxImage();
    }

    // Navigate to next image
    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % imageSources.length;
        updateLightboxImage();
    }

    // ==================== ZOOM + PAN FUNCTIONALITY (Binal Patel Style) ====================
    // Click to zoom in, move mouse to pan, click again to exit
    galleryImages.forEach((container, index) => {
        const img = container.querySelector('img');
        let isZoomed = false;

        // Click to toggle zoom
        container.addEventListener('click', (e) => {
            if (!isZoomed) {
                // Activate zoom mode
                isZoomed = true;
                container.classList.add('zoom-active');

                // Calculate initial pan position based on click
                updatePan(e, container, img);
            } else {
                // Deactivate zoom mode
                isZoomed = false;
                container.classList.remove('zoom-active');
                img.style.transformOrigin = '';
            }
        });

        // Mouse move for panning when zoomed
        container.addEventListener('mousemove', (e) => {
            if (isZoomed) {
                updatePan(e, container, img);
            }
        });

        // Reset zoom when mouse leaves
        container.addEventListener('mouseleave', () => {
            if (isZoomed) {
                isZoomed = false;
                container.classList.remove('zoom-active');
                img.style.transformOrigin = '';
            }
        });
    });

    // Helper function to update pan position
    function updatePan(e, container, img) {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
    }

    // Lightbox controls
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxBackdrop) {
        lightboxBackdrop.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            prevImage();
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            nextImage();
        });
    }

    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                prevImage();
                break;
            case 'ArrowRight':
                nextImage();
                break;
        }
    });
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
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger, .reveal-card');
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

    // Add reveal to insights section title (support both class variations)
    const insightsTitle = document.querySelector('.insights-title, .fashion-insights-title');
    if (insightsTitle) {
        insightsTitle.classList.add('reveal');
    }

    // Add reveal-card to fashion insight cards for subtle staggered entrance
    const insightCards = document.querySelectorAll('.fashion-insight-card');
    insightCards.forEach(card => {
        card.classList.add('reveal-card');
    });

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

// Initialize Cart Manager (for Drawer)
if (typeof CartManager !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CartManager.init());
    } else {
        CartManager.init();
    }
}

/**
 * Mobile Footer Accordion Logic
 * Handles the expand/collapse behavior for footer sections on mobile
 */
const MobileFooterAccordion = {
    init() {
        const toggles = document.querySelectorAll('.footer-accordion-toggle');

        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                // Prevent default behavior
                e.preventDefault();

                // Get the content element
                const content = toggle.nextElementSibling;
                const isOpen = toggle.classList.contains('active');

                // Close all other sections
                toggles.forEach(otherToggle => {
                    if (otherToggle !== toggle && otherToggle.classList.contains('active')) {
                        otherToggle.classList.remove('active');
                        otherToggle.setAttribute('aria-expanded', 'false');
                        const otherContent = otherToggle.nextElementSibling;
                        if (otherContent) {
                            otherContent.classList.remove('active');
                            otherContent.style.maxHeight = null;
                        }
                    }
                });

                // Toggle current section
                if (isOpen) {
                    toggle.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                    if (content) {
                        content.classList.remove('active');
                        content.style.maxHeight = null;
                    }
                } else {
                    toggle.classList.add('active');
                    toggle.setAttribute('aria-expanded', 'true');
                    if (content) {
                        content.classList.add('active');
                        // Set max-height to scrollHeight for transition
                        content.style.maxHeight = content.scrollHeight + 'px';
                    }
                }
            });
        });
    }
};

// ==================== WOOCOMMERCE FEATURED PRODUCT (PHASE 2) ====================
document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('wcFeaturedProduct');
    if (!container) return;

    fetch('/api/products')
        .then(function (res) {
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        })
        .then(function (data) {
            // API returns { products: [...] }
            const products = data.products;
            if (!products || !products.length) return;

            var product = products[0];
            var image = product.primaryImage;
            var name = product.name;
            var regularPrice = Number(product.regularPrice) || 0;
            var salePrice = Number(product.salePrice) || 0;
            var hasSale = salePrice > 0 && regularPrice > salePrice;
            var currentPrice = hasSale ? salePrice : (Number(product.price) || 0);
            var inStock = product.inStock;

            var imageHTML = image
                ? '<a href="product-detail.html?id=' + product.id + '"><img src="' + image + '" alt="' + name + '" style="width:100%;display:block;aspect-ratio:3/4;object-fit:cover;" /></a>'
                : '';

            var ctaHTML = inStock
                ? '<a href="product-detail.html?id=' + product.id + '" style="display:inline-block;margin-top:16px;padding:12px 32px;border:1px solid #2c2c2c;font-family:inherit;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#2c2c2c;text-decoration:none;">View Product</a>'
                : '<span style="display:inline-block;margin-top:16px;font-family:inherit;font-size:12px;letter-spacing:1.5px;color:#999;text-transform:uppercase;">Currently Unavailable</span>';

            container.innerHTML =
                '<div style="max-width:420px;margin:60px auto;padding:0 20px;text-align:center;">' +
                '<h2 style="font-family:\'Pinyon Script\', cursive; font-size: 32px; margin-bottom: 20px; color: #b8860b;">Latest from the Loom</h2>' +
                imageHTML +
                '<h3 style="margin:20px 0 8px;font-family:\'Cormorant Garamond\',serif;font-size:22px;font-weight:400;letter-spacing:1px;color:#2c2c2c;text-transform:uppercase;">' + name + '</h3>' +
                '<div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">' +
                (hasSale
                    ? '<span style="font-family:\'Roboto\',sans-serif;font-size:13px;letter-spacing:1px;color:#8a8a8a;text-decoration:line-through;">₹' + regularPrice.toLocaleString('en-IN') + '</span>'
                    : '') +
                '<span style="font-family:\'Roboto\',sans-serif;font-size:14px;letter-spacing:1px;color:' + (hasSale ? '#b42d1d' : '#555') + ';">₹' + currentPrice.toLocaleString('en-IN') + '</span>' +
                '</div>' +
                '<div>' + ctaHTML + '</div>' +
                '</div>';
        })
        .catch(function (err) {
            console.error('Featured Product Load Error:', err);
        });
});

// ==================== PDP DYNAMIC PRODUCT LOADING (PHASE 3) ====================
document.addEventListener('DOMContentLoaded', function () {
    // Only run on product-detail page
    var titleEl = document.getElementById('pdpTitle');
    if (!titleEl) return;

    // 1. Read product ID from URL query string
    var params = new URLSearchParams(window.location.search);
    var productId = params.get('id');

    // 2. If product ID is missing, stop execution
    if (!productId) return;

    // 3. Fetch product data
    fetch('/api/product?id=' + encodeURIComponent(productId))
        .then(function (res) {
            if (!res.ok) throw new Error('Failed to fetch product');
            return res.json();
        })
        .then(function (product) {
            if (!product) return;

            // 4a. Replace title (WordPress API returns 'name')
            titleEl.textContent = product.name;

            // 4b. Replace price
            var priceEl = document.getElementById('pdpPrice');
            if (priceEl) {
                var currentPrice = Number(product.price) || 0;
                var regularPrice = Number(product.regularPrice) || 0;
                var salePrice = Number(product.salePrice) || 0;
                var hasSale = salePrice > 0 && regularPrice > salePrice;

                if (hasSale) {
                    priceEl.innerHTML =
                        '<span class="product-price-regular">Rs.' + regularPrice.toLocaleString('en-IN') + '/-</span>' +
                        '<span class="product-price-current product-price-current--sale">Rs.' + salePrice.toLocaleString('en-IN') + '/-</span>';
                } else {
                    priceEl.innerHTML =
                        '<span class="product-price-current">Rs.' + currentPrice.toLocaleString('en-IN') + '/-</span>';
                }
            }

            // 4c. Replace images with optimized versions - DYNAMIC GALLERY
            var images = product.images || [];
            var img0 = document.getElementById('pdpImage0'); // Hero image
            var galleryGrid = document.getElementById('pdpGalleryGrid'); // Grid container

            // Helper to handle optimized source replacement
            var setOptimizedSrc = function (el, src, width) {
                if (!el || !src) return;

                // Add shimmer to parent if not already there
                if (el.parentElement) el.parentElement.classList.add('luxury-shimmer');

                // Use ProductRenderer helper if available, otherwise fallback
                var optimizedUrl = window.ProductRenderer
                    ? window.ProductRenderer.getOptimizedImage(src, width)
                    : src;

                // Set the src — the onload in HTML will handle removing shimmer
                el.src = optimizedUrl;
            };

            // Set hero image (first image)
            if (images[0]) {
                setOptimizedSrc(img0, images[0], 1000);
            }

            // Fill ALL existing placeholder slots first (pdpImage1, pdpImage2, pdpImage3...)
            // then add extra images below if there are more than 4
            var galleryImages = document.querySelector('.gallery-images');
            if (images.length > 1) {
                // 1. Fill existing hardcoded slots by ID: pdpImage1, pdpImage2, pdpImage3, ...
                var imgIndex = 1;
                var existingImg;
                while (imgIndex < images.length) {
                    existingImg = document.getElementById('pdpImage' + imgIndex);
                    if (existingImg) {
                        // Fill the existing placeholder
                        setOptimizedSrc(existingImg, images[imgIndex], imgIndex === 3 ? 1000 : 600);
                        imgIndex++;
                    } else {
                        // No more existing slots — break out to add extras
                        break;
                    }
                }

                // 2. If more images remain beyond placeholders, add them dynamically
                if (imgIndex < images.length && galleryImages) {
                    for (; imgIndex < images.length; imgIndex++) {
                        var imageWrapper = document.createElement('div');
                        imageWrapper.className = 'gallery-image luxury-shimmer';
                        imageWrapper.dataset.index = imgIndex;

                        var imgEl = document.createElement('img');
                        imgEl.id = 'pdpImage' + imgIndex;
                        imgEl.alt = 'Product view ' + (imgIndex + 1);
                        imgEl.loading = 'lazy';
                        imgEl.onload = function () {
                            this.parentElement.classList.remove('luxury-shimmer');
                            this.style.opacity = '1';
                        };

                        imageWrapper.appendChild(imgEl);
                        galleryImages.appendChild(imageWrapper);

                        setOptimizedSrc(imgEl, images[imgIndex], 600);
                    }
                }

                // 3. Hide any unused placeholder slots beyond available images
                var nextSlotIdx = images.length;
                while (true) {
                    var unusedSlot = document.getElementById('pdpImage' + nextSlotIdx);
                    if (!unusedSlot) break;
                    unusedSlot.parentElement.style.display = 'none';
                    nextSlotIdx++;
                }
            }

            // 4d. Update product-info data attributes (for cart/wishlist)
            var productInfo = document.querySelector('.product-info');
            if (productInfo) {
                productInfo.dataset.productId = product.id;
                productInfo.dataset.productName = product.name;
                productInfo.dataset.productPrice = product.price;
                productInfo.dataset.stockQuantity = product.stockQuantity ?? '';
                if (images[0]) {
                    productInfo.dataset.productImage = images[0];
                }
            }

            // 5. Cart Logic — enforces stock limits
            var addBtn = document.getElementById('addToCartBtn');
            if (addBtn) {
                if (product.inStock === false) {
                    addBtn.textContent = 'OUT OF STOCK';
                    addBtn.disabled = true;
                    addBtn.classList.add('disabled');
                } else {
                    // Show stock hint if managed and low
                    var stockQty = product.stockQuantity;
                    if (stockQty !== null && stockQty !== undefined && stockQty <= 5) {
                        var stockHint = document.createElement('p');
                        stockHint.className = 'product-stock-hint';
                        stockHint.textContent = 'Only ' + stockQty + ' left in stock';
                        stockHint.style.cssText = 'font-size:0.8rem;color:#c0392b;margin-top:6px;font-family:var(--font-body);';
                        addBtn.parentNode.insertBefore(stockHint, addBtn.nextSibling);
                    }

                    addBtn.textContent = 'BUY NOW';

                    addBtn.addEventListener('click', function (e) {
                        e.preventDefault();

                        // Create product object with stock info for CartManager
                        var cartProduct = {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: images[0] || 'assets/images/placeholder.webp',
                            stockQuantity: product.stockQuantity ?? null
                        };

                        // Add to cart using global CartManager (enforces stock limit)
                        if (window.CartManager) {
                            var result = window.CartManager.addItem(cartProduct);

                            if (result && result.success) {
                                // Show a brief feedback state
                                addBtn.textContent = 'ADDING...';

                                // Small delay to let the user see the state
                                setTimeout(function () {
                                    window.location.href = 'cart.html';
                                }, 300);
                            }
                            // If result.success is false, CartManager already showed notification
                        } else {
                            console.error('CartManager not found');
                            window.location.href = 'cart.html';
                        }
                    });
                }
            }

            // 6. Populate PDP Accordion Descriptions from ACF custom fields
            if (product.acf) {
                // Helper: convert plain-text newlines to HTML paragraphs/breaks
                // Mimics WordPress wpautop() for content from WYSIWYG editor
                var autoParagraph = function (text) {
                    if (!text || typeof text !== 'string') return '';
                    // If content already has block-level HTML, just clean up newlines
                    if (/<(p|ul|ol|h[1-6]|div|table|blockquote)\b/i.test(text)) {
                        // Replace double newlines with paragraph breaks where no HTML blocks exist
                        return text
                            .replace(/\r\n/g, '\n')
                            .replace(/\n{2,}/g, '</p>\n<p>')
                            .replace(/(?<!\>)\n(?!\<)/g, '<br>\n');
                    }
                    // Pure text: wrap in paragraphs
                    var paragraphs = text
                        .replace(/\r\n/g, '\n')
                        .split(/\n{2,}/)
                        .filter(function (p) { return p.trim(); })
                        .map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; });
                    return paragraphs.join('\n');
                };

                // Description & Fit — with "Read More" truncation
                if (product.acf.fabricComposition) {
                    var descEl = document.getElementById('pdpAccordionDescription');
                    if (descEl) {
                        var fullHTML = autoParagraph(product.acf.fabricComposition);
                        // Strip HTML for character counting
                        var tempDiv = document.createElement('div');
                        tempDiv.innerHTML = fullHTML;
                        var plainText = tempDiv.textContent || tempDiv.innerText || '';

                        var CHAR_LIMIT = 200;

                        if (plainText.length > CHAR_LIMIT) {
                            // Build truncated preview: cut at limit, find last space
                            var truncated = plainText.substring(0, CHAR_LIMIT);
                            var lastSpace = truncated.lastIndexOf(' ');
                            if (lastSpace > 100) truncated = truncated.substring(0, lastSpace);
                            truncated += '…';

                            // Build the DOM structure
                            descEl.innerHTML = '';

                            // Preview (visible by default)
                            var previewEl = document.createElement('div');
                            previewEl.className = 'desc-preview';
                            previewEl.innerHTML = '<p>' + truncated + '</p>';
                            descEl.appendChild(previewEl);

                            // Full content (hidden by default)
                            var fullEl = document.createElement('div');
                            fullEl.className = 'desc-full';
                            fullEl.innerHTML = fullHTML;
                            descEl.appendChild(fullEl);

                            // Read More / Read Less toggle
                            var toggleBtn = document.createElement('button');
                            toggleBtn.className = 'accordion-read-more';
                            toggleBtn.type = 'button';
                            toggleBtn.textContent = 'Read More';
                            toggleBtn.addEventListener('click', function () {
                                var isExpanded = descEl.classList.contains('desc-expanded');
                                descEl.classList.toggle('desc-expanded');
                                toggleBtn.textContent = isExpanded ? 'Read More' : 'Read Less';
                            });
                            descEl.appendChild(toggleBtn);
                        } else {
                            // Short content — show without truncation
                            descEl.innerHTML = fullHTML;
                        }
                    }
                }

                // Materials
                if (product.acf.materialDetails) {
                    var matEl = document.getElementById('pdpAccordionMaterials');
                    if (matEl) matEl.innerHTML = autoParagraph(product.acf.materialDetails);
                }

                // Care Guide
                if (product.acf.careInstructions) {
                    var careEl = document.getElementById('pdpAccordionCare');
                    if (careEl) careEl.innerHTML = autoParagraph(product.acf.careInstructions);
                }

                // Delivery, Payment and Returns
                if (product.acf.deliveryInfo) {
                    var delEl = document.getElementById('pdpAccordionDelivery');
                    if (delEl) delEl.innerHTML = autoParagraph(product.acf.deliveryInfo);
                }

                console.log('PDP: Accordion descriptions populated from WooCommerce ACF fields');
            }
        })
        .catch(function (err) {
            console.error('PDP Load Error:', err);
            // Fail silently — placeholders remain
        });
});

// ==================== COOKIE CONSENT MANAGER ====================
/**
 * Cookie consent implementation:
 * - Stores consent preferences in a first-party cookie
 * - Supports category-based script activation via data-consent-category
 * - Provides banner + preferences modal + persistent "Cookie Settings" button
 */
const CookieConsentManager = {
    cookieName: 'loom_cookie_consent',
    cookieLifetimeDays: 180,
    consentVersion: 1,
    dismissSessionKey: 'loom_cookie_banner_dismissed',
    currentConsent: null,
    elements: {},

    init() {
        this.injectMarkup();
        this.wireSettingsLinks();
        this.cacheElements();
        this.bindEvents();

        const storedConsent = this.getStoredConsent();
        if (storedConsent) {
            this.currentConsent = this.normalizeConsent(storedConsent);
            this.applyConsent(this.currentConsent, false);
            this.hideBanner();
        } else {
            this.currentConsent = this.getDefaultConsent();
            if (this.isBannerDismissedForSession()) {
                this.hideBanner();
            } else {
                this.showBanner();
            }
        }
    },

    wireSettingsLinks() {
        const allLinks = document.querySelectorAll('a');
        allLinks.forEach((link) => {
            const label = (link.textContent || '').trim().toLowerCase();
            if (label === 'privacy & cookies') {
                link.setAttribute('href', '#');
                link.setAttribute('data-cookie-settings-link', 'true');
            }
        });
    },

    getDefaultConsent() {
        return {
            essential: true,
            preferences: false,
            analytics: false,
            marketing: false,
            consentVersion: this.consentVersion,
            updatedAt: null,
            method: null,
        };
    },

    normalizeConsent(rawConsent) {
        const defaults = this.getDefaultConsent();
        if (!rawConsent || typeof rawConsent !== 'object') {
            return defaults;
        }

        return {
            essential: true,
            preferences: Boolean(rawConsent.preferences),
            analytics: Boolean(rawConsent.analytics),
            marketing: Boolean(rawConsent.marketing),
            consentVersion: Number(rawConsent.consentVersion || this.consentVersion),
            updatedAt: rawConsent.updatedAt || null,
            method: rawConsent.method || null,
        };
    },

    injectMarkup() {
        if (document.getElementById('cookieConsentBanner')) return;

        const bannerMarkup = `
      <div class="cookie-consent" id="cookieConsentBanner" role="region" aria-label="Cookie consent">
        <button type="button" class="cookie-consent__close" data-cookie-action="dismiss-banner" aria-label="Close cookie notice">×</button>
        <div class="cookie-consent__content">
          <p class="cookie-consent__title">Your Privacy Choices</p>
          <p class="cookie-consent__text">
            We use essential cookies for core site functions, and optional cookies for analytics and marketing.
            You can choose only essential cookies, accept all, or manage your preferences.
            Read our <a href="cookie-policy.html" class="cookie-consent__link">Cookie Policy</a>.
          </p>
        </div>
        <div class="cookie-consent__actions">
          <button type="button" class="cookie-consent__btn cookie-consent__btn--ghost" data-cookie-action="reject-optional">Only Essential</button>
          <button type="button" class="cookie-consent__btn cookie-consent__btn--neutral" data-cookie-action="open-modal">Manage Preferences</button>
          <button type="button" class="cookie-consent__btn cookie-consent__btn--primary" data-cookie-action="accept-all">Accept All</button>
        </div>
      </div>
      <div class="cookie-modal" id="cookieConsentModal" aria-hidden="true">
        <button type="button" class="cookie-modal__backdrop" data-cookie-action="close-modal" aria-label="Close cookie settings"></button>
        <div class="cookie-modal__panel" role="dialog" aria-modal="true" aria-labelledby="cookieConsentModalTitle">
          <div class="cookie-modal__header">
            <h2 class="cookie-modal__title" id="cookieConsentModalTitle">Cookie Preferences</h2>
            <button type="button" class="cookie-modal__close" data-cookie-action="close-modal" aria-label="Close">×</button>
          </div>
          <p class="cookie-modal__intro">
            Essential cookies are always on. Optional categories can be changed any time.
          </p>
          <div class="cookie-modal__category">
            <div>
              <p class="cookie-modal__category-title">Essential</p>
              <p class="cookie-modal__category-text">Required for navigation, security, and core functionality.</p>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" checked disabled aria-label="Essential cookies are always enabled">
              <span class="cookie-switch__slider"></span>
            </label>
          </div>
          <div class="cookie-modal__category">
            <div>
              <p class="cookie-modal__category-title">Preferences</p>
              <p class="cookie-modal__category-text">Remember choices like language, region, and UI settings.</p>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="cookiePreferencesToggle" aria-label="Enable preferences cookies">
              <span class="cookie-switch__slider"></span>
            </label>
          </div>
          <div class="cookie-modal__category">
            <div>
              <p class="cookie-modal__category-title">Analytics</p>
              <p class="cookie-modal__category-text">Help us understand usage and improve performance.</p>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="cookieAnalyticsToggle" aria-label="Enable analytics cookies">
              <span class="cookie-switch__slider"></span>
            </label>
          </div>
          <div class="cookie-modal__category">
            <div>
              <p class="cookie-modal__category-title">Marketing</p>
              <p class="cookie-modal__category-text">Used for campaign measurement and personalized promotions.</p>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="cookieMarketingToggle" aria-label="Enable marketing cookies">
              <span class="cookie-switch__slider"></span>
            </label>
          </div>
          <div class="cookie-modal__footer">
            <button type="button" class="cookie-consent__btn cookie-consent__btn--ghost cookie-modal__btn--left" data-cookie-action="reject-optional">Only Essential</button>
            <button type="button" class="cookie-consent__btn cookie-consent__btn--primary cookie-modal__btn--center" data-cookie-action="accept-all">Accept All</button>
            <button type="button" class="cookie-consent__btn cookie-consent__btn--neutral cookie-modal__btn--right" data-cookie-action="save-preferences">Save Preferences</button>
          </div>
        </div>
      </div>
      <button type="button" class="cookie-settings-fab" id="cookieSettingsFab" data-cookie-action="open-modal" aria-label="Open cookie settings">
        Cookie Settings
      </button>
    `;

        document.body.insertAdjacentHTML('beforeend', bannerMarkup);
    },

    cacheElements() {
        this.elements.banner = document.getElementById('cookieConsentBanner');
        this.elements.modal = document.getElementById('cookieConsentModal');
        this.elements.settingsFab = document.getElementById('cookieSettingsFab');
        this.elements.prefToggle = document.getElementById('cookiePreferencesToggle');
        this.elements.analyticsToggle = document.getElementById('cookieAnalyticsToggle');
        this.elements.marketingToggle = document.getElementById('cookieMarketingToggle');
    },

    bindEvents() {
        document.addEventListener('click', (event) => {
            const settingsLink = event.target.closest('[data-cookie-settings-link]');
            if (settingsLink) {
                event.preventDefault();
                this.openModal();
                return;
            }

            const actionButton = event.target.closest('[data-cookie-action]');
            if (!actionButton) return;

            const action = actionButton.getAttribute('data-cookie-action');
            if (!action) return;

            event.preventDefault();

            if (action === 'accept-all') {
                this.applyConsent(
                    {
                        essential: true,
                        preferences: true,
                        analytics: true,
                        marketing: true,
                    },
                    true,
                    'accept_all'
                );
                this.closeModal();
                this.hideBanner();
                this.clearBannerDismissedForSession();
                return;
            }

            if (action === 'reject-optional') {
                this.applyConsent(
                    {
                        essential: true,
                        preferences: false,
                        analytics: false,
                        marketing: false,
                    },
                    true,
                    'reject_optional'
                );
                this.closeModal();
                this.hideBanner();
                this.clearBannerDismissedForSession();
                return;
            }

            if (action === 'dismiss-banner') {
                this.setBannerDismissedForSession();
                this.hideBanner();
                return;
            }

            if (action === 'open-modal') {
                this.openModal();
                return;
            }

            if (action === 'close-modal') {
                this.closeModal();
                return;
            }

            if (action === 'save-preferences') {
                this.applyConsent(
                    {
                        essential: true,
                        preferences: Boolean(this.elements.prefToggle && this.elements.prefToggle.checked),
                        analytics: Boolean(this.elements.analyticsToggle && this.elements.analyticsToggle.checked),
                        marketing: Boolean(this.elements.marketingToggle && this.elements.marketingToggle.checked),
                    },
                    true,
                    'save_preferences'
                );
                this.closeModal();
                this.hideBanner();
                this.clearBannerDismissedForSession();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.elements.modal && this.elements.modal.classList.contains('cookie-modal--visible')) {
                this.closeModal();
            }
        });
    },

    showBanner() {
        if (!this.elements.banner) return;
        this.elements.banner.classList.add('cookie-consent--visible');
    },

    hideBanner() {
        if (!this.elements.banner) return;
        this.elements.banner.classList.remove('cookie-consent--visible');
    },

    isBannerDismissedForSession() {
        try {
            return window.sessionStorage.getItem(this.dismissSessionKey) === 'true';
        } catch (error) {
            return false;
        }
    },

    setBannerDismissedForSession() {
        try {
            window.sessionStorage.setItem(this.dismissSessionKey, 'true');
        } catch (error) {
            // Ignore storage failures in strict/private contexts
        }
    },

    clearBannerDismissedForSession() {
        try {
            window.sessionStorage.removeItem(this.dismissSessionKey);
        } catch (error) {
            // Ignore storage failures in strict/private contexts
        }
    },

    openModal() {
        if (!this.elements.modal) return;
        this.syncToggles();
        this.elements.modal.classList.add('cookie-modal--visible');
        this.elements.modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cookie-modal-open');
    },

    closeModal() {
        if (!this.elements.modal) return;
        this.elements.modal.classList.remove('cookie-modal--visible');
        this.elements.modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cookie-modal-open');
    },

    syncToggles() {
        const consent = this.currentConsent || this.getDefaultConsent();
        if (this.elements.prefToggle) this.elements.prefToggle.checked = Boolean(consent.preferences);
        if (this.elements.analyticsToggle) this.elements.analyticsToggle.checked = Boolean(consent.analytics);
        if (this.elements.marketingToggle) this.elements.marketingToggle.checked = Boolean(consent.marketing);
    },

    setCookie(name, value, days) {
        const maxAge = days * 24 * 60 * 60;
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    },

    getCookie(name) {
        const nameEq = `${name}=`;
        const pairs = document.cookie.split(';');
        for (let i = 0; i < pairs.length; i += 1) {
            const pair = pairs[i].trim();
            if (pair.startsWith(nameEq)) {
                return decodeURIComponent(pair.substring(nameEq.length));
            }
        }
        return null;
    },

    getStoredConsent() {
        const cookieValue = this.getCookie(this.cookieName);
        if (!cookieValue) return null;
        try {
            return JSON.parse(cookieValue);
        } catch (error) {
            console.warn('Cookie consent value is invalid JSON:', error);
            return null;
        }
    },

    persistConsent(consent, method) {
        const payload = {
            ...this.normalizeConsent(consent),
            method: method || 'save_preferences',
            updatedAt: new Date().toISOString(),
            consentVersion: this.consentVersion,
        };

        this.setCookie(this.cookieName, JSON.stringify(payload), this.cookieLifetimeDays);
        return payload;
    },

    applyConsent(consent, persist, method) {
        const shouldPersist = persist !== false;
        const normalized = this.normalizeConsent(consent);
        this.currentConsent = shouldPersist ? this.persistConsent(normalized, method) : normalized;

        document.documentElement.setAttribute('data-cookie-preferences', String(Boolean(this.currentConsent.preferences)));
        document.documentElement.setAttribute('data-cookie-analytics', String(Boolean(this.currentConsent.analytics)));
        document.documentElement.setAttribute('data-cookie-marketing', String(Boolean(this.currentConsent.marketing)));

        this.activateDeferredScripts();

        window.dispatchEvent(
            new CustomEvent('loom:cookie-consent-updated', {
                detail: { ...this.currentConsent },
            })
        );
    },

    isAllowed(category) {
        if (!category || category === 'essential') return true;
        if (!this.currentConsent) return false;
        return Boolean(this.currentConsent[category]);
    },

    activateDeferredScripts() {
        const deferredScripts = document.querySelectorAll('script[type="text/plain"][data-consent-category]:not([data-consent-activated="true"])');
        deferredScripts.forEach((scriptTag) => {
            const category = scriptTag.getAttribute('data-consent-category');
            if (!this.isAllowed(category)) return;

            const replacementScript = document.createElement('script');
            const source = scriptTag.getAttribute('data-src');

            if (source) {
                replacementScript.src = source;
            } else {
                replacementScript.text = scriptTag.textContent || '';
            }

            if (scriptTag.getAttribute('data-async') === 'true') {
                replacementScript.async = true;
            }

            if (scriptTag.getAttribute('data-defer') === 'true') {
                replacementScript.defer = true;
            }

            const customType = scriptTag.getAttribute('data-script-type');
            if (customType) {
                replacementScript.type = customType;
            }

            const integrity = scriptTag.getAttribute('data-integrity');
            if (integrity) replacementScript.integrity = integrity;

            const crossOrigin = scriptTag.getAttribute('data-crossorigin');
            if (crossOrigin) replacementScript.crossOrigin = crossOrigin;

            scriptTag.setAttribute('data-consent-activated', 'true');
            scriptTag.parentNode.insertBefore(replacementScript, scriptTag.nextSibling);
        });
    },
};

window.CookieConsentManager = CookieConsentManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CookieConsentManager.init());
} else {
    CookieConsentManager.init();
}
