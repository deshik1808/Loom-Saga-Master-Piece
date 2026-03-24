export default async function handler(req, res) {
  const { WC_API_URL } = process.env;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, productName, productId } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  if (!productName) {
    return res.status(400).json({ error: "Product name is required" });
  }

  if (!WC_API_URL) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const wpUrl = `${WC_API_URL}/wp-json/loomsaga/v1/notify-restock`;

    const response = await fetch(wpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        productName: productName,
        productId: productId || ''
      }),
    });

    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("WordPress returned non-JSON:", text);
      return res.status(500).json({ error: "Server invalid formatting", details: text });
    }

    if (!response.ok) {
      console.error("WordPress Error:", data);
      return res.status(500).json({ error: data.message || "Failed to notify" });
    }

    return res.status(200).json({ success: true, message: "Notification request sent successfully" });
  } catch (error) {
    console.error("Notify API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

