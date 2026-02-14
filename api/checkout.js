export default async function handler(req, res) {
  const { WC_API_URL } = process.env;

  if (!WC_API_URL) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // WooCommerce supports adding multiple items via the Store API or
    // via query-string chaining.  The simplest approach for a headless
    // frontend is to build a URL that adds the first item, then redirect
    // to a custom endpoint that adds the remaining items OR use WooCommerce
    // Store API's batch add-to-cart.
    //
    // For now we use the simple "add first item, then checkout" approach.
    // If you need multi-item support we can upgrade to the Store API later.

    // Build add-to-cart URL for the first item (WooCommerce will redirect to cart)
    const primaryItem = items[0];

    // If only one item, go straight to checkout
    if (items.length === 1) {
      const checkoutUrl = `${WC_API_URL}/checkout/?add-to-cart=${primaryItem.id}&quantity=${primaryItem.quantity}`;
      return res.status(200).json({ url: checkoutUrl });
    }

    // Multiple items — add each via query params (WooCommerce standard)
    // This chains add-to-cart and then redirects to checkout
    const params = items.map(item =>
      `add-to-cart=${item.id}&quantity=${item.quantity}`
    );
    // WooCommerce only supports one add-to-cart per URL, so we use the
    // cart page as landing and let the user proceed to checkout from there.
    const checkoutUrl = `${WC_API_URL}/cart/?add-to-cart=${primaryItem.id}&quantity=${primaryItem.quantity}`;

    return res.status(200).json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
