/**
 * Category Router
 * Detects category from URL and handles dynamic rendering for the master template
 */

const CategoryRouter = {
    // Mapping of slugs to pretty titles (as fallback)
    slugToTitle: {
        'silk-sarees': 'SILK SAREES',
        'vishnupuri-silk': 'VISHNUPURI SILK',
        'muslin-sarees': 'MUSLIN SAREES',
        'jamdani-sarees': 'JAMDANI SAREES',
        'modal-silk': 'MODAL SILK SAREES',
        'tussar-silk': 'TUSSAR SILK SAREES',
        'matka-jamdani': 'MATKA JAMDANI SAREES',
        'tussar-dhakai-jamdani': 'TUSSAR DHAKAI JAMDANI',
        'muslin-jamdani': 'MUSLIN JAMDANI SAREES',
        'tissue-matka-jamdani': 'TISSUE MATKA JAMDANI',
        'silk-lenin': 'SILK LENIN SAREES',
        // Fabric categories
        'silk': 'SILK',
        'tissue-silk': 'TISSUE SILK',
        'lenin': 'LENIN',
        'cotton': 'COTTON',
        // Craft categories
        'zari-weaving': 'ZARI WEAVING',
        'ikat': 'IKAT',
        'handloom-weaving': 'HANDLOOM WEAVING',
        'kalamkari': 'KALAMKARI',
        'jamdani-weaving': 'JAMDANI WEAVING',
        'temple-border': 'TEMPLE BORDER',
        'hand-painting': 'HAND PAINTING',
        // Color categories
        'red': 'RED',
        'yellow': 'YELLOW',
        'brown': 'BROWN',
        'black': 'BLACK',
        'blue': 'BLUE',
        'pink': 'PINK',
        'green': 'GREEN',
        'lavender': 'LAVENDER',
        'orange': 'ORANGE',
        'sea-green': 'SEA GREEN',
        'multi-color': 'MULTI COLOR'
    },

    init: async function () {
        const container = document.getElementById('categoryPageContainer');
        if (!container) return;

        // 1. Get slug from URL
        // Priority: ?type=slug > path based (if configured in rewrites)
        const urlParams = new URLSearchParams(window.location.search);
        let slug = urlParams.get('type');
        let searchQuery = urlParams.get('q');

        // Fallback: If no type param, try to infer from pathname (for vercel rewrites)
        if (!slug && !searchQuery) {
            const path = window.location.pathname.replace(/^\/|\.html$/g, '');
            // Only use path if it's not the actual file name
            if (path && path !== 'category') {
                slug = path;
            }
        }

        if (!slug && !searchQuery) {
            console.warn('Category Router: No category slug or search query found in URL');
            this.showEmpty('Please select a collection to browse.');
            return;
        }

        console.log('Category Router: Loading category or search ->', slug || searchQuery);

        // 2. Update Page UI (Titles/SEO) — set title IMMEDIATELY before product fetch
        this.updateUI(slug, searchQuery);

        // 3. Fetch and Render Products
        try {
            await window.ProductService.init();
            let products = [];

            if (searchQuery) {
                products = window.ProductService.searchProducts(searchQuery);
            } else {
                products = window.ProductService.getProductsByCategory(slug);
            }

            const grid = document.getElementById('categoryProductsGrid');
            if (grid) {
                const skeletons = grid.querySelectorAll('.skeleton-card');

                if (skeletons.length > 0) {
                    // Fade out skeletons
                    skeletons.forEach(s => s.classList.add('fade-out-premium'));

                    // Delay render to allow fade out
                    setTimeout(() => {
                        grid.innerHTML = '';
                        if (products.length > 0) {
                            window.ProductRenderer.renderGrid(products, grid);
                            grid.classList.add('fade-in-premium');

                            // Clean up fade class
                            setTimeout(() => {
                                grid.classList.remove('fade-in-premium');
                            }, 800);
                        } else {
                            this.showEmpty(searchQuery
                                ? `No products found for "${searchQuery}".`
                                : `No products found in the ${this.formatTitle(slug)} collection.`);
                        }
                    }, 500);
                } else {
                    grid.innerHTML = '';
                    if (products.length > 0) {
                        window.ProductRenderer.renderGrid(products, grid);
                    } else {
                        this.showEmpty(searchQuery
                            ? `No products found for "${searchQuery}".`
                            : `No products found in the ${this.formatTitle(slug)} collection.`);
                    }
                }
            }
        } catch (error) {
            console.error('Category Router: Failed to load products', error);
            this.showEmpty('Unable to load products. Please try again later.');
        }
    },

    updateUI: function (slug, searchQuery) {
        const titleEl = document.getElementById('categoryTitle');
        let prettyTitle = "";

        if (searchQuery) {
            prettyTitle = `SEARCH RESULTS FOR "${searchQuery.toUpperCase()}"`;
        } else {
            prettyTitle = this.formatTitle(slug);
        }

        if (titleEl) titleEl.textContent = prettyTitle;
        document.title = `${prettyTitle} | Loom Saga - Weaving Indian Culture`;

        // Update canonical if possible
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.href = searchQuery ? `https://loomsaga.com/search?q=${encodeURIComponent(searchQuery)}` : `https://loomsaga.com/${slug}`;
    },

    formatTitle: function (slug) {
        if (!slug) return '';
        // Use map if exists, otherwise format slug (hyphen to space + uppercase)
        if (this.slugToTitle[slug]) return this.slugToTitle[slug];

        return slug
            .split('-')
            .map(word => word.toUpperCase())
            .join(' ');
    },

    showEmpty: function (message) {
        const grid = document.getElementById('categoryProductsGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:5rem 1rem;">
                    <p style="font-family:var(--font-heading); font-size:1.2rem; color:#555; letter-spacing:0.05em;">
                        ${message}
                    </p>
                    <a href="/category?type=all" class="view-more-link" style="margin-top:20px; display:inline-block;">View All Collections</a>
                </div>
            `;
        }
    }
};

// Start the router when DOM is ready
document.addEventListener('DOMContentLoaded', () => CategoryRouter.init());
