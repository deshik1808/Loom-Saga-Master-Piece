/**
 * POST /api/auth/login
 *
 * Authenticates a user against WordPress using JWT tokens.
 * Uses the JWT Authentication for WP REST API plugin.
 *
 * Body: { email: string, password: string }
 * Returns: { success, user: { ... }, token: string, expiresAt: number }
 */
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { WC_API_URL } = process.env;

    if (!WC_API_URL) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Step 1: Get JWT token from WordPress
        const tokenResponse = await fetch(`${WC_API_URL}/wp-json/jwt-auth/v1/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: email,
                password: password,
            }),
        });

        if (!tokenResponse.ok) {
            const status = tokenResponse.status;

            if (status === 403 || status === 401) {
                // Try to extract error message from JWT plugin
                let errorMsg = 'Invalid email or password.';
                try {
                    const errBody = await tokenResponse.json();
                    if (errBody?.message) {
                        errorMsg = errBody.message;
                    }
                } catch (_) { /* ignore */ }

                return res.status(401).json({ error: errorMsg });
            }

            console.error('JWT token error:', status);
            return res.status(500).json({
                error: 'Unable to sign in at this time. Please try again later.',
            });
        }

        const tokenData = await tokenResponse.json();
        const { token, user_email, user_nicename, user_display_name } = tokenData;

        if (!token) {
            console.error('JWT response missing token:', tokenData);
            return res.status(500).json({ error: 'Authentication failed.' });
        }

        // Step 2: Decode JWT to get expiration (optional, for frontend convenience)
        // JWT format: header.payload.signature
        let expiresAt = null;
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            expiresAt = payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
        } catch (err) {
            console.warn('Could not decode JWT expiration:', err);
        }

        // Step 3: Fetch full user profile using the JWT token
        const userResponse = await fetch(`${WC_API_URL}/wp-json/wp/v2/users/me?context=edit`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        let userProfile = {
            email: user_email,
            displayName: user_display_name || user_nicename,
            firstName: '',
            lastName: '',
        };

        if (userResponse.ok) {
            const wpUser = await userResponse.json();
            userProfile = {
                id: wpUser.id,
                email: wpUser.email || user_email,
                displayName: wpUser.name || user_display_name || user_nicename,
                firstName: wpUser.first_name || '',
                lastName: wpUser.last_name || '',
            };
        }

        return res.status(200).json({
            success: true,
            user: userProfile,
            token: token,
            expiresAt: expiresAt,
        });

    } catch (error) {
        console.error('Login API error:', error);
        return res.status(500).json({
            error: 'An unexpected error occurred. Please try again later.',
        });
    }
}
