import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite plugin to mirror Vercel rewrites for local development.
 * Rewrites /category/<slug> → /category.html?category=<slug> so the
 * dynamic category page works in both `npm run dev` and `vercel dev`.
 */
function categoryRewritePlugin() {
  return {
    name: 'category-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url && req.url.match(/^\/category\/([^?./]+)/);
        if (match) {
          req.url = `/category.html?type=${match[1]}`;
        } else if (req.url === '/category' || req.url === '/category/') {
          req.url = '/category.html?type=all';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  // Root is the project root
  root: '.',

  // Plugins
  plugins: [categoryRewritePlugin()],

  // Build options
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        cart: resolve(__dirname, 'cart.html'),
        category: resolve(__dirname, 'category.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        contact: resolve(__dirname, 'contact.html'),
        'cookie-policy': resolve(__dirname, 'cookie-policy.html'),
        'fashion-insights': resolve(__dirname, 'fashion-insights.html'),
        'forgot-password': resolve(__dirname, 'forgot-password.html'),
        handloom: resolve(__dirname, 'handloom.html'),
        login: resolve(__dirname, 'login.html'),
        'my-account': resolve(__dirname, 'my-account.html'),
        'order-confirmation': resolve(__dirname, 'order-confirmation.html'),
        'product-detail': resolve(__dirname, 'product-detail.html'),
        register: resolve(__dirname, 'register.html'),
        wishlist: resolve(__dirname, 'wishlist.html'),
        'brand-story': resolve(__dirname, 'brand-story.html'),
        'article-golden-beauty': resolve(__dirname, 'article-golden-beauty.html'),
        'article': resolve(__dirname, 'article.html'),
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Use esbuild for minification (built-in, no extra dependency)
    minify: 'esbuild',
  },

  // Dev server options
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    open: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
  },

  // CSS options
  css: {
    devSourcemap: true,
  },

  // Optimize deps
  optimizeDeps: {
    include: [],
  },
});
