# GEMINI.md

## Project Overview

This project is a luxury e-commerce website for a brand called "Loom Saga," which specializes in handcrafted sarees. The website is a static site built with HTML, CSS, and JavaScript. It uses Vite as a build tool and dependency manager.

The website has a modern and elegant design, with a focus on high-quality imagery and typography. It features a variety of pages, including a homepage, product listing pages, product detail pages, a blog, and customer account pages.

The front-end is built with vanilla JavaScript and is well-structured, with modules for different functionalities like cart management, wishlist management, and product filtering. It uses `localStorage` to persist cart and wishlist data.

The project also includes a detailed `products.json` file that serves as a database for the products sold on the website.

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
*   **JavaScript**: The project uses vanilla JavaScript, with a modular approach. The main JavaScript file is `js/main.js`, which is well-commented and organized.
*   **HTML**: The HTML is well-structured and uses semantic tags.
*   **Dependencies**: The project has only one development dependency, `vite`.
*   **Vite Configuration**: The `vite.config.js` file is used to configure the Vite build process, including defining multiple entry points for the different HTML pages.
*   **Data**: The product data is stored in a JSON file at `data/products.json`.

## File Structure

The project has a standard file structure for a front-end project:

*   `assets/`: Contains images and icons.
*   `css/`: Contains the main stylesheet.
*   `data/`: Contains JSON data for products, categories, and collections.
*   `js/`: Contains the main JavaScript file.
*   `src/`: Contains the source files for the CSS and JavaScript.
*   `*.html`: The root directory contains all the HTML pages.
*   `GEMINI.md`: This file, providing an overview of the project.
