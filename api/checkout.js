export default async function handler(req, res) {
  const { WC_API_URL } = process.env;

  if (!WC_API_URL) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const normalizedItems = items
      .map((item) => ({
        id: item?.id, // Can be string for local products or integer for Woo
        quantity: Number(item?.quantity),
      }))
      .filter((item) => item.id && Number.isInteger(item.quantity) && item.quantity > 0);

    if (normalizedItems.length === 0) {
      return res.status(400).json({ error: "Invalid cart items" });
    }

    // We use a custom parameter 'ls_checkout' instead of 'add-to-cart'.
    // This prevents WooCommerce's default handler from running, 
    // allowing our custom WordPress snippet to take full control.
    const ids = normalizedItems.map(item => item.id).join(',');
    const quantities = normalizedItems.map(item => item.quantity).join(',');

    let checkoutUrl = `${WC_API_URL}/checkout/?ls_checkout=${ids}&ls_qty=${quantities}`;

    // Forward the authentication token if provided, so WP snippet can log user in instantly
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      checkoutUrl += `&ls_token=${token}`;
    }

    return res.status(200).json({
      url: checkoutUrl,
      itemCount: normalizedItems.length,
      note: "Custom Sync: Redirecting to Checkout with full cart data."
    });

    return res.status(200).json({
      url: checkoutUrl,
      itemCount: normalizedItems.length,
      note: "Bypassing cart: Direct redirect to Checkout."
    });
  } catch (error) {
    console.error("Checkout API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
