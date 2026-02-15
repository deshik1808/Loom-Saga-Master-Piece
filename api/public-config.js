function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const wpBaseUrl = normalizeBaseUrl(process.env.WP_BASE_URL || process.env.WC_API_URL || "");

  if (!wpBaseUrl) {
    return res.status(500).json({ error: "Public configuration is missing" });
  }

  return res.status(200).json({ wpBaseUrl });
}
