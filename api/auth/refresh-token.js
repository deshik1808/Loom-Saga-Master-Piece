/**
 * POST /api/auth/refresh-token
 *
 * Refreshes an expired or expiring JWT token.
 * Uses the JWT Authentication for WP REST API plugin.
 *
 * Body: { token: string }
 * Returns: { success, token: string, expiresAt: number }
 */
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

    const { token } = req.body || {};
    const authHeader = req.headers.authorization;

    // Token can come from body or Authorization header
    const jwtToken = token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

    if (!jwtToken) {
        return res.status(400).json({ error: 'Token is required.' });
    }

    try {
        const refreshResponse = await fetch(`${WC_API_URL}/wp-json/jwt-auth/v1/token/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!refreshResponse.ok) {
            const status = refreshResponse.status;

            if (status === 403 || status === 401) {
                return res.status(401).json({
                    error: 'Token is invalid or expired. Please sign in again.',
                });
            }

            console.error('JWT refresh error:', status);
            return res.status(500).json({
                error: 'Unable to refresh token. Please sign in again.',
            });
        }

        const refreshData = await refreshResponse.json();
        const newToken = refreshData.token;

        if (!newToken) {
            console.error('JWT refresh response missing token:', refreshData);
            return res.status(500).json({ error: 'Token refresh failed.' });
        }

        // Decode new token to get expiration
        let expiresAt = null;
        try {
            const payload = JSON.parse(Buffer.from(newToken.split('.')[1], 'base64').toString());
            expiresAt = payload.exp ? payload.exp * 1000 : null;
        } catch (err) {
            console.warn('Could not decode JWT expiration:', err);
        }

        return res.status(200).json({
            success: true,
            token: newToken,
            expiresAt: expiresAt,
        });

    } catch (error) {
        console.error('Refresh token API error:', error);
        return res.status(500).json({
            error: 'An unexpected error occurred. Please try again later.',
        });
    }
}
