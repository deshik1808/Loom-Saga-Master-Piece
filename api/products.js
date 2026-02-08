export default async function handler(req, res) {
  const { WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env;

  if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

  try {
    const response = await fetch(`${WC_API_URL}/wp-json/wc/v3/products`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch products" });
    }

    const wcProducts = await response.json();

    const products = wcProducts.map((product) => ({
      id: product.id,
      title: product.name,
      price: parseFloat(product.price) || 0,
      primaryImage: product.images?.[0]?.src || null,
      availability: product.stock_status === "instock" ? "instock" : "outofstock",
    }));

    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
