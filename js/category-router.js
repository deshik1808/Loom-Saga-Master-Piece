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
        'silk-lenin': 'SILK LENIN SAREES'
    },

    init: async function() {
        const container = document.getElementById('categoryPageContainer');
        if (!container) return;

        // 1. Get slug from URL
        // Priority: ?type=slug > path based (if configured in rewrites)
        const urlParams = new URLSearchParams(window.location.search);
        let slug = urlParams.get('type');

        // Fallback: If no type param, try to infer from pathname (for vercel rewrites)
        if (!slug) {
            const path = window.location.pathname.replace(/^\/|\.html$/g, '');
            // Only use path if it's not the actual file name
            if (path && path !== 'category') {
                slug = path;
            }
        }

        if (!slug) {
            console.warn('Category Router: No category slug found in URL');
            this.showEmpty('Please select a collection to browse.');
            return;
        }

        console.log('Category Router: Loading category ->', slug);

        // 2. Update Page UI (Titles/SEO)
        this.updateUI(slug);

        // 3. Fetch and Render Products
        try {
            await window.ProductService.init();
            const products = window.ProductService.getProductsByCategory(slug);
            
            const grid = document.getElementById('categoryProductsGrid');
            if (grid) {
                grid.innerHTML = '';
                if (products.length > 0) {
                    window.ProductRenderer.renderGrid(products, grid);
                } else {
                    this.showEmpty(`No products found in the ${this.formatTitle(slug)} collection.`);
                }
            }
        } catch (error) {
            console.error('Category Router: Failed to load products', error);
            this.showEmpty('Unable to load products. Please try again later.');
        }
    },

    updateUI: function(slug) {
        const titleEl = document.getElementById('categoryTitle');
        const prettyTitle = this.formatTitle(slug);
        
        if (titleEl) titleEl.textContent = prettyTitle;
        document.title = `${prettyTitle} | Loom Saga - Weaving Indian Culture`;
        
        // Update canonical if possible
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.href = `https://loomsaga.com/${slug}`;
    },

    formatTitle: function(slug) {
        // Use map if exists, otherwise format slug (hyphen to space + uppercase)
        if (this.slugToTitle[slug]) return this.slugToTitle[slug];
        
        return slug
            .split('-')
            .map(word => word.toUpperCase())
            .join(' ');
    },

    showEmpty: function(message) {
        const grid = document.getElementById('categoryProductsGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:5rem 1rem;">
                    <p style="font-family:var(--font-heading); font-size:1.2rem; color:#555; letter-spacing:0.05em;">
                        ${message}
                    </p>
                    <a href="collections.html" class="view-more-link" style="margin-top:20px; display:inline-block;">View All Collections</a>
                </div>
            `;
        }
    }
};

// Start the router when DOM is ready
document.addEventListener('DOMContentLoaded', () => CategoryRouter.init());
