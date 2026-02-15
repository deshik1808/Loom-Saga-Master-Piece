/**
 * POST /api/contact
 *
 * Receives contact-form submissions from the frontend and forwards them
 * to WordPress via the Contact Form 7 REST API.
 *
 * Required env vars:
 *   WC_API_URL   – WordPress site URL (e.g. https://your-site.com/subfolder)
 *   CF7_FORM_ID  – The numeric ID of the CF7 form in wp-admin
 *
 * Body: { name: string, email: string, phone?: string, comment?: string }
 */
export default async function handler(req, res) {
    // CORS headers (same pattern as other API routes)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { WC_API_URL, CF7_FORM_ID } = process.env;

    if (!WC_API_URL || !CF7_FORM_ID) {
        console.error("Missing env vars – WC_API_URL:", !!WC_API_URL, "CF7_FORM_ID:", !!CF7_FORM_ID);
        return res.status(500).json({ error: "Server configuration error" });
    }

    const { name, email, phone, comment } = req.body || {};

    // Email is the only strictly required field
    if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "A valid email is required." });
    }

    try {
        // CF7 REST API requires multipart/form-data
        const formData = new FormData();

        // CF7 internal fields (required by the REST API)
        formData.append("_wpcf7", CF7_FORM_ID);
        formData.append("_wpcf7_version", "6.0");
        formData.append("_wpcf7_unit_tag", `wpcf7-f${CF7_FORM_ID}-o1`);
        formData.append("_wpcf7_locale", "en_US");

        // User-submitted form fields (must match CF7 form tag names)
        formData.append("your-name", name || "");
        formData.append("your-email", email);
        formData.append("your-phone", phone || "");
        formData.append("your-message", comment || "");

        const cf7Url = `${WC_API_URL}/wp-json/contact-form-7/v1/contact-forms/${CF7_FORM_ID}/feedback`;

        // Do NOT set Content-Type manually — fetch auto-generates the correct
        // multipart/form-data boundary when using FormData
        const response = await fetch(cf7Url, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.status === "mail_sent") {
            return res
                .status(200)
                .json({ success: true, message: data.message || "Message sent!" });
        }

        // CF7 returns status "validation_failed", "mail_failed", "spam", etc.
        console.error("CF7 error response:", JSON.stringify(data));
        return res.status(422).json({
            error: data.message || "Failed to send message. Please try again.",
        });
    } catch (error) {
        console.error("Contact API Error:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}
