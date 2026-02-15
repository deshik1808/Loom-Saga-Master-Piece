export default async function handler(req, res) {
  const { WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

  try {
    /**
     * We use the WooCommerce Customers API.
     * This is more reliable for headless setups.
     */
    const wcUrl = `${WC_API_URL}/wp-json/wc/v3/customers`;

    const response = await fetch(wcUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        username: email.split('@')[0] + Math.floor(Math.random() * 1000), // Create a unique username
        role: "customer"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If the email already exists, we treat it as a success for the user
      if (data.code === "registration-error-email-exists") {
        return res.status(200).json({ success: true, message: "Already subscribed!" });
      }
      
      console.error("WooCommerce Error:", data);
      return res.status(500).json({ error: data.message || "Failed to save to WordPress" });
    }

    return res.status(200).json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    console.error("Newsletter API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
