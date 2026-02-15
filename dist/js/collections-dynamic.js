/**
 * Collections Dynamic Loader
 * Handles live rendering of products from WordPress on the collections page
 */
document.addEventListener('DOMContentLoaded', async () => {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    // Wait for ProductService to initialize (it's initialized in main.js)
    // But we'll call init() again here to be safe, it returns the same promise if already loading
    try {
        await window.ProductService.init();
        const products = window.ProductService.getAllProducts();
        
        if (products.length > 0) {
            // Clear static placeholders
            productsGrid.innerHTML = '';
            
            // Render live products
            window.ProductRenderer.renderGrid(products, productsGrid, {
                animate: true,
                emptyMessage: 'No sarees found in our current collection.'
            });
            
            console.log('Collections: Successfully rendered live products from WordPress');
        } else {
            console.warn('Collections: No products found in live API');
        }
    } catch (error) {
        console.error('Collections: Error loading products', error);
    }
});
