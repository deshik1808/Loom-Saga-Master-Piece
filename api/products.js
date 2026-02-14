export default async function handler(req, res) {
  const { WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env;

  if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

  try {
    // Support optional category filter via query param
    const categorySlug = req.query.category || "";
    let apiUrl = `${WC_API_URL}/wp-json/wc/v3/products?per_page=100&status=publish`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WC API Error:", response.status, errorText);
      return res.status(500).json({ error: "Failed to fetch products" });
    }

    const wcProducts = await response.json();

    const products = wcProducts.map((product) => {
      // Extract ALL category names and slugs
      const categories = (product.categories || []).map(c => ({
        name: c.name,
        slug: c.slug
      }));

      // Primary category is the first one
      const primaryCategory = categories[0]?.slug || "uncategorized";
      const primaryCategoryName = categories[0]?.name || "Uncategorized";

      return {
        id: product.id.toString(),
        sku: product.sku || "",
        name: product.name,
        slug: product.slug,
        price: parseFloat(product.price) || 0,
        regularPrice: parseFloat(product.regular_price) || 0,
        salePrice: parseFloat(product.sale_price) || 0,
        description: product.description,
        shortDescription: product.short_description,

        // Images
        primaryImage: product.images?.[0]?.src || "",
        images: product.images?.map(img => img.src) || [],

        // Categories — pass all so frontend can match pages
        category: primaryCategory,
        categoryName: primaryCategoryName,
        categories: categories,

        // Stock
        inStock: product.stock_status === "instock",
        stockQuantity: product.stock_quantity ?? null,    // null = unlimited
        manageStock: product.manage_stock || false,

        // Feature flags
        featured: product.featured || false,
        newArrival: product.date_created > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),

        // Attributes — pass them ALL so the frontend filter system works
        attributes: {
          color: product.attributes?.find(a => a.name.toLowerCase() === "color")?.options?.[0] || null,
          fabric: product.attributes?.find(a => a.name.toLowerCase() === "fabric")?.options?.[0] || null,
          occasion: product.attributes?.find(a => a.name.toLowerCase() === "occasion")?.options || [],
          // Pass raw attributes for any custom needs
          raw: (product.attributes || []).map(a => ({
            name: a.name,
            options: a.options
          }))
        },

        // Tags
        tags: product.tags?.map(t => t.name) || [],

        // Checkout URL
        checkoutUrl: `${WC_API_URL}/cart/?add-to-cart=${product.id}`
      };
    });

    // If a category filter was requested client-side, filter here
    let filteredProducts = products;
    if (categorySlug) {
      filteredProducts = products.filter(p =>
        p.categories.some(c => c.slug === categorySlug)
      );
    }

    return res.status(200).json({ products: filteredProducts });
  } catch (error) {
    console.error("Products API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
