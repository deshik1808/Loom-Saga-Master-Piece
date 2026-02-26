export default async function handler(req, res) {
  const { WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env;

  if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 1. Validate token with WP to get user ID
    const userResponse = await fetch(`${WC_API_URL}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!userResponse.ok) {
      console.error("Token validation failed", await userResponse.text());
      return res.status(401).json({ error: "Unauthorized: Token invalid or expired" });
    }

    const userData = await userResponse.json();
    const wpUserId = userData.id;
    // req.query is available in Vercel serverless functions
    const wpUserEmail = req.query.email || userData.email || userData.user_email;

    if (!wpUserId && !wpUserEmail) {
      return res.status(500).json({ error: "Could not resolve user ID or email" });
    }

    // 2. Fetch WooCommerce Orders for this user ID AND by billing email
    const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

    // Fetch orders by user ID
    const urlById = `${WC_API_URL}/wp-json/wc/v3/orders?customer=${wpUserId}`;
    // Fetch recent orders (for guest checkouts matching this user's email missing in search index)
    const urlRecent = `${WC_API_URL}/wp-json/wc/v3/orders?per_page=50`;

    const [ordersByIdRes, ordersRecentRes] = await Promise.all([
      fetch(urlById, { headers: { Authorization: `Basic ${credentials}` } }),
      fetch(urlRecent, { headers: { Authorization: `Basic ${credentials}` } }),
    ]);

    if (!ordersByIdRes.ok && !ordersRecentRes.ok) {
      console.error("Orders fetch failed", await ordersByIdRes.text());
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    let ordersById = [];
    if (ordersByIdRes.ok) {
      ordersById = await ordersByIdRes.json();
    }

    let ordersByEmail = [];
    if (ordersRecentRes.ok && wpUserEmail) {
      const recentOrders = await ordersRecentRes.json();
      ordersByEmail = recentOrders.filter(order => order.billing && order.billing.email === wpUserEmail);
    }

    // Merge and deduplicate by order ID
    const allOrdersMap = new Map();
    [...ordersById, ...ordersByEmail].forEach(order => {
      allOrdersMap.set(order.id, order);
    });

    // Convert back to array and sort by date descending
    let orders = Array.from(allOrdersMap.values());
    orders.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());

    // Map WooCommerce orders to frontend format
    const formattedOrders = orders.map(order => ({
      id: order.id,
      number: order.number,
      status: order.status,
      date_created: order.date_created,
      total: parseFloat(order.total),
      currency: order.currency,
      currency_symbol: order.currency_symbol,
      line_items: order.line_items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        total: parseFloat(item.total),
        image: item.image?.src || ''
      })),
      shipping_total: parseFloat(order.shipping_total),
      payment_method_title: order.payment_method_title
    }));

    return res.status(200).json({ success: true, orders: formattedOrders });

  } catch (error) {
    console.error("Orders API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
