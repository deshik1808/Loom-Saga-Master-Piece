/**
 * POST /api/auth/forgot-password
 *
 * Triggers a WordPress password-reset email for the given user.
 *
 * Strategy:
 *   1. Look up the user by email via WP REST API.
 *   2. If found, call the WP core password-reset endpoint.
 *   3. Always return a success message (to avoid email enumeration).
 *
 * Body: { email: string }
 * Returns: { success, message }
 */
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env;

    if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { email } = req.body || {};

    if (!email) {
        return res.status(400).json({ error: 'Please enter your email address.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Always return success to prevent email enumeration attacks.
    // The actual reset email is sent server-side if the email exists.
    const successMessage =
        'If an account exists with this email, you will receive a password reset link shortly. Please check your inbox and spam folder.';

    try {
        const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');

        // Step 1: Find the customer by email via WooCommerce API
        const searchResponse = await fetch(
            `${WC_API_URL}/wp-json/wc/v3/customers?email=${encodeURIComponent(email.trim().toLowerCase())}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!searchResponse.ok) {
            console.error('WC customer search error:', searchResponse.status);
            // Still return success to avoid enumeration
            return res.status(200).json({ success: true, message: successMessage });
        }

        const customers = await searchResponse.json().catch(() => []);

        if (!Array.isArray(customers) || customers.length === 0) {
            // No such customer, but we don't reveal that
            return res.status(200).json({ success: true, message: successMessage });
        }

        // Step 2: Trigger WordPress password reset
        // We'll use the WordPress REST API to submit the lost password form
        // by POSTing to the wp-login.php endpoint server-side
        const formData = new URLSearchParams();
        formData.append('user_login', email.trim().toLowerCase());
        formData.append('redirect_to', '');
        formData.append('wp-submit', 'Get New Password');

        const resetResponse = await fetch(
            `${WC_API_URL}/wp-login.php?action=lostpassword`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
                redirect: 'manual', // Don't follow redirects — WordPress redirects after success
            }
        );

        // WordPress returns a 302 redirect on success, or a 200 if there's an error
        // In either case, the email has been triggered if the account exists
        if (resetResponse.status === 302 || resetResponse.status === 200) {
            return res.status(200).json({ success: true, message: successMessage });
        }

        console.error('WP password reset response:', resetResponse.status);
        return res.status(200).json({ success: true, message: successMessage });

    } catch (error) {
        console.error('Forgot-password API error:', error);
        // Even on error, don't expose internals
        return res.status(200).json({ success: true, message: successMessage });
    }
}
