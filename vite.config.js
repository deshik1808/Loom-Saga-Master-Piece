import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

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

function productDetailRewritePlugin() {
  return {
    name: 'product-detail-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.match(/^\/product-detail(\?|$)/)) {
          req.url = req.url.replace('/product-detail', '/product-detail.html');
        }
        next();
      });
    },
  };
}


function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api/') && req.url !== '/api/newsletter') {
          try {
            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            let urlPath = urlObj.pathname;
            let filePath = resolve(process.cwd(), `.${urlPath}.js`);
            if (!fs.existsSync(filePath)) {
              filePath = resolve(process.cwd(), `.${urlPath}/index.js`);
            }
            if (fs.existsSync(filePath)) {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  if (body) {
                    try { req.body = JSON.parse(body); } catch (e) { req.body = body; }
                  } else {
                    req.body = {};
                  }

                  req.query = Object.fromEntries(urlObj.searchParams);

                  const env = loadEnv('', process.cwd(), '');
                  Object.assign(process.env, env);

                  res.status = function (code) { this.statusCode = code; return this; };
                  res.json = function (data) {
                    this.setHeader('Content-Type', 'application/json');
                    this.end(JSON.stringify(data));
                  };
                  res.send = function (data) { this.end(data); };

                  const fileUrl = pathToFileURL(filePath).href;
                  const module = await import(fileUrl + '?t=' + Date.now());
                  if (module.default) {
                    await module.default(req, res);
                  } else {
                    res.status(500).json({ error: "No default export found in API handler" });
                  }
                } catch (err) {
                  console.error("Vercel Dev Plugin Error:", err);
                  res.status(500).json({ error: "Internal server error in dev plugin" });
                }
              });
              return;
            }
          } catch (e) {
            console.error("Failed handling request", e);
          }
        }
        next();
      });
    }
  };
}

function apiNewsletterPlugin() {
  return {
    name: 'api-newsletter',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/newsletter' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { email } = JSON.parse(body);
              if (!email || !email.includes('@')) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "A valid email is required" }));
                return;
              }

              // Load env vars natively using Vite
              const env = loadEnv('', process.cwd(), '');
              const { WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = env;
              if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Server configuration error" }));
                return;
              }

              const wcUrl = `${WC_API_URL}/wp-json/wc/v3/customers`;
              const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

              const response = await fetch(wcUrl, {
                method: "POST",
                headers: {
                  "Authorization": `Basic ${credentials}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: email,
                  username: email.split('@')[0] + Math.floor(Math.random() * 1000),
                  role: "customer"
                }),
              });

              const text = await response.text();
              let data = {};
              try { data = JSON.parse(text); } catch (e) { }

              res.setHeader('Content-Type', 'application/json');

              if (!response.ok) {
                if (data.code === "registration-error-email-exists") {
                  res.end(JSON.stringify({ success: true, message: "Already subscribed!" }));
                } else {
                  console.error("WooCommerce Error inside proxy:", text);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: data.message || "Failed to save to WordPress" }));
                }
              } else {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, message: "Subscribed successfully" }));
              }
            } catch (err) {
              console.error("Vite Plugin Error:", err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || "Internal server error" }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  // Root is the project root
  root: '.',

  // Plugins
  plugins: [categoryRewritePlugin(), productDetailRewritePlugin(), vercelApiDevPlugin(), apiNewsletterPlugin()],

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
