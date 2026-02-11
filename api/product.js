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

    const mapped = {
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price) || 0,
      regularPrice: parseFloat(product.regular_price) || 0,
      description: product.description,
      shortDescription: product.short_description,
      primaryImage: product.images?.[0]?.src || "assets/images/placeholder.webp",
      images: product.images?.map(img => img.src) || [],
      category: product.categories?.[0]?.name || "Uncategorized",
      featured: product.featured || false,
      inStock: product.stock_status === "instock",
      attributes: {
        color: product.attributes?.find(a => a.name.toLowerCase() === "color")?.options?.[0] || null,
        fabric: product.attributes?.find(a => a.name.toLowerCase() === "fabric")?.options?.[0] || null,
        occasion: product.attributes?.find(a => a.name.toLowerCase() === "occasion")?.options || []
      },
      tags: product.tags?.map(t => t.name) || [],
      checkoutUrl: `${WC_API_URL}/cart/?add-to-cart=${product.id}`
    };

    return res.status(200).json(mapped);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
