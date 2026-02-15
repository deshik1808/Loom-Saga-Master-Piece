# GEMINI.md

## Project Overview

This project is a luxury e-commerce website for a brand called "Loom Saga," which specializes in handcrafted sarees. The website is a static site built with HTML, CSS, and JavaScript. It uses Vite as a build tool and dependency manager.

The website has a modern and elegant design, with a focus on high-quality imagery and typography. It features a variety of pages, including a homepage, product listing pages, product detail pages, a blog, and customer account pages.

The front-end is built with vanilla JavaScript and is well-structured, with modules for different functionalities like cart management, wishlist management, and product filtering. It uses `localStorage` to persist cart and wishlist data.

The project uses a **headless WooCommerce** architecture: WordPress with WooCommerce serves as the backend (product management, stock, checkout), while the frontend is statically hosted on Vercel. Vercel serverless functions in the `api/` directory proxy requests to the WooCommerce REST API, keeping credentials server-side.

The project also includes a `data/products.json` file that serves as a fallback data source when the WooCommerce API is unavailable.

## Architecture

### Data Flow
1. **WooCommerce** (WordPress) → manages products, stock, orders, checkout
2. **Vercel Serverless Functions** (`api/products.js`, `api/product.js`, `api/checkout.js`) → proxy WooCommerce REST API, normalise data
3. **Auth Serverless Functions** (`api/auth/login.js`, `api/auth/register.js`, `api/auth/forgot-password.js`) → headless authentication against WordPress REST API
4. **Frontend Modules** (`src/js/modules/ProductService.js`) → fetch from `/api/products`, fallback to `/data/products.json`
5. **Auth Module** (`src/js/modules/AuthManager.js`) → login, register, forgot-password, session management via localStorage
6. **Rendering** (`src/js/modules/ProductRenderer.js`) → renders product cards, badges (Out of Stock, Sale), cart drawer items
7. **Cart** (`src/js/modules/CartManager.js`) → localStorage persistence, stock-quantity enforcement
8. **Checkout** → frontend cart page → WooCommerce checkout redirect via `/api/checkout`

### Key Integration Points
- **Stock Limits**: `CartManager.addItem()` checks `stockQuantity` and refuses to add beyond available stock.
- **Out of Stock**: Products with `inStock === false` show a badge, faded imagery, and disabled "Add to Cart" button.
- **Category Matching**: Products are matched to listing pages via WooCommerce category slugs (e.g., `silk-sarees`, `vishnupuri-silk`).
- **Authentication**: Uses headless auth via Vercel serverless functions → WordPress REST API (Basic Auth, server-to-server). No JWT plugin required. Session stored in `localStorage`.

## Building and Running

The project uses `npm` for package management and `vite` for development and building.

### Development

To run the project in development mode, use the following command:

```bash
npm run dev
```

This will start a development server with hot-reloading at `http://localhost:3000`.

### Building

To build the project for production, use the following command:

```bash
npm run build
```

This will create a `dist` directory with the optimized and minified files.

### Preview

To preview the production build locally, use the following command:

```bash
npm run preview
```

## Development Conventions

*   **Styling**: The project uses a custom CSS file (`css/styles.css`) for styling. The CSS is well-structured and uses a consistent naming convention. It uses CSS variables extensively for colors, fonts, spacing, and transitions.
*   **JavaScript**: The project uses vanilla JavaScript, with a modular approach. The main JavaScript file is `js/main.js`, which is well-commented and organized. ES Module versions live in `src/js/modules/`.
*   **HTML**: The HTML is well-structured and uses semantic tags.
*   **Dependencies**: The project has only one development dependency, `vite`.
*   **Vite Configuration**: The `vite.config.js` file is used to configure the Vite build process, including defining multiple entry points for the different HTML pages.
*   **Data**: Product data comes from WooCommerce via serverless functions. Local fallback at `data/products.json`.
*   **Environment Variables**: WooCommerce credentials are stored in `.env.local` (never committed).

## File Structure

The project has a standard file structure for a front-end project:

*   `api/`: Vercel serverless functions (products, product, checkout).
*   `api/auth/`: Vercel serverless functions for authentication (login, register, forgot-password).
*   `assets/`: Contains images and icons.
*   `css/`: Contains the main stylesheet.
*   `data/`: Contains JSON data for products (fallback), categories, and collections.
*   `js/`: Contains the legacy main JavaScript file.
*   `src/js/modules/`: Contains ES Module versions of AuthManager, CartManager, ProductService, ProductRenderer, WishlistManager, ScrollAnimations.
*   `*.html`: The root directory contains all the HTML pages.
*   `.env.local`: WooCommerce API credentials (not committed).
*   `GEMINI.md`: This file, providing an overview of the project.
