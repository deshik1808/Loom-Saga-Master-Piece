export default async function handler(req, res) {
  const { WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env;

  if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const productId = req.query.id;
  if (!productId) {
    return res.status(400).json({ error: "Missing product ID" });
  }

  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

  try {
    const response = await fetch(`${WC_API_URL}/wp-json/wc/v3/products/${productId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch product" });
    }

    const product = await response.json();

    // Extract ALL categories
    const categories = (product.categories || []).map(c => ({
      name: c.name,
      slug: c.slug
    }));

    const mapped = {
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

      // Categories
      category: categories[0]?.slug || "uncategorized",
      categoryName: categories[0]?.name || "Uncategorized",
      categories: categories,

      // Stock
      inStock: product.stock_status === "instock",
      stockQuantity: product.stock_quantity ?? null,
      manageStock: product.manage_stock || false,

      // Feature flags
      featured: product.featured || false,

      // Attributes
      attributes: {
        color: product.attributes?.find(a => a.name.toLowerCase() === "color")?.options?.[0] || null,
        fabric: product.attributes?.find(a => a.name.toLowerCase() === "fabric")?.options?.[0] || null,
        occasion: product.attributes?.find(a => a.name.toLowerCase() === "occasion")?.options || [],
        raw: (product.attributes || []).map(a => ({
          name: a.name,
          options: a.options
        }))
      },

      // Tags
      tags: product.tags?.map(t => t.name) || [],

      // Checkout
      checkoutUrl: `${WC_API_URL}/cart/?add-to-cart=${product.id}`
    };

    return res.status(200).json(mapped);
  } catch (error) {
    console.error("Product API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
