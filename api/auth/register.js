/**
 * POST /api/auth/register
 *
 * Creates a new WordPress/WooCommerce customer account.
 * Uses WooCommerce REST API (admin credentials, server-to-server).
 * Auto-logins with JWT after successful registration.
 *
 * Body: { email: string, password: string, firstName?: string, lastName?: string }
 * Returns: { success, user: { ... }, token: string, expiresAt: number, autoLoggedIn: boolean }
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

    const { email, password, firstName, lastName } = req.body || {};

    // ---- Validation ----
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Password strength
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    try {
        // Step 1: Create a WooCommerce customer via the REST API
        const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');

        const customerData = {
            email: email.trim().toLowerCase(),
            password: password,
            first_name: (firstName || '').trim(),
            last_name: (lastName || '').trim(),
            username: email.trim().toLowerCase().split('@')[0], // derive username from email
        };

        const wcResponse = await fetch(`${WC_API_URL}/wp-json/wc/v3/customers`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData),
        });

        const responseBody = await wcResponse.json().catch(() => ({}));

        if (!wcResponse.ok) {
            const errCode = responseBody?.code || '';
            const errMessage = responseBody?.message || '';

            // WooCommerce returns specific error codes for duplicates
            if (errCode === 'registration-error-email-exists' || errMessage.includes('email already') || errCode === 'customer_invalid_email') {
                return res.status(409).json({
                    error: 'An account with this email already exists. Please sign in instead.',
                });
            }

            if (errCode === 'registration-error-username-exists' || errMessage.includes('username already')) {
                return res.status(409).json({
                    error: 'An account with this username already exists. Please try a different email.',
                });
            }

            console.error('WC register error:', wcResponse.status, JSON.stringify(responseBody));
            return res.status(500).json({
                error: errMessage || 'Unable to create your account at this time. Please try again later.',
            });
        }

        const newUser = responseBody;

        // Step 2: Auto-login by getting JWT token
        let jwtToken = null;
        let expiresAt = null;

        try {
            const tokenResponse = await fetch(`${WC_API_URL}/wp-json/jwt-auth/v1/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email.trim().toLowerCase(),
                    password: password,
                }),
            });

            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                jwtToken = tokenData.token;

                // Decode JWT to get expiration
                try {
                    const payload = JSON.parse(Buffer.from(jwtToken.split('.')[1], 'base64').toString());
                    expiresAt = payload.exp ? payload.exp * 1000 : null;
                } catch (_) { /* ignore */ }
            }
        } catch (err) {
            console.warn('Auto-login after registration failed:', err);
            // Continue anyway — registration succeeded
        }

        return res.status(201).json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                displayName: `${newUser.first_name || ''} ${newUser.last_name || ''}`.trim() || newUser.username,
                firstName: newUser.first_name || '',
                lastName: newUser.last_name || '',
            },
            token: jwtToken,
            expiresAt: expiresAt,
            autoLoggedIn: !!jwtToken,
        });

    } catch (error) {
        console.error('Register API error:', error);
        return res.status(500).json({
            error: 'An unexpected error occurred. Please try again later.',
        });
    }
}
