/**
 * POST /api/auth/forgot-password
 *
 * Triggers a WordPress password-reset email for the given user.
 *
 * Strategy:
 *   1. Look up the customer by email via WooCommerce REST API.
 *   2. If NOT found, check if there are guest orders with this email.
 *   3. If guest orders exist, auto-create a WooCommerce customer account,
 *      then trigger the password reset — this lets guest buyers claim their account.
 *   4. If a customer IS found, trigger a normal WordPress password reset.
 *   5. Return an appropriate message depending on the scenario.
 *
 * Body: { email: string }
 * Returns: { success, message, accountCreated? }
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

    const normalizedEmail = email.trim().toLowerCase();
    const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');

    // Generic message for existing accounts (prevents email enumeration)
    const existingAccountMessage =
        'If an account exists with this email, you will receive a password reset link shortly. Please check your inbox and spam folder.';

    // Message for newly created accounts from guest orders
    const newAccountMessage =
        'We found your order! An account has been created for you and a password setup link has been sent to your email. Please check your inbox and spam folder.';

    // Message when no account and no orders found
    const noAccountMessage =
        'No account was found with this email address. If you checked out as a guest, please create a new account using the same email to view your orders.';

    try {
        // Step 1: Search for existing customer
        const searchResponse = await fetch(
            `${WC_API_URL}/wp-json/wc/v3/customers?email=${encodeURIComponent(normalizedEmail)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        let customers = [];
        if (searchResponse.ok) {
            customers = await searchResponse.json().catch(() => []);
        }

        const customerExists = Array.isArray(customers) && customers.length > 0;

        if (!customerExists) {
            // Step 2: No customer account — check for guest orders with this email
            const ordersResponse = await fetch(
                `${WC_API_URL}/wp-json/wc/v3/orders?search=${encodeURIComponent(normalizedEmail)}&per_page=1`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            let guestOrders = [];
            if (ordersResponse.ok) {
                guestOrders = await ordersResponse.json().catch(() => []);
            }

            // Filter to make sure the email actually matches billing email
            const hasGuestOrders = Array.isArray(guestOrders) && guestOrders.some(order => {
                const billingEmail = (order.billing?.email || '').toLowerCase();
                return billingEmail === normalizedEmail;
            });

            if (!hasGuestOrders) {
                // No account AND no guest orders → tell them honestly
                return res.status(200).json({
                    success: false,
                    noAccount: true,
                    message: noAccountMessage,
                });
            }

            // Step 3: Guest orders found — auto-create a customer account
            // Extract name from the most recent order's billing info
            const recentOrder = guestOrders.find(order =>
                (order.billing?.email || '').toLowerCase() === normalizedEmail
            );
            const firstName = recentOrder?.billing?.first_name || '';
            const lastName = recentOrder?.billing?.last_name || '';

            // Generate a random password (user will reset it via the email link)
            const randomPassword = generateSecurePassword();

            const createCustomerResponse = await fetch(
                `${WC_API_URL}/wp-json/wc/v3/customers`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: normalizedEmail,
                        first_name: firstName,
                        last_name: lastName,
                        username: normalizedEmail.split('@')[0],
                        password: randomPassword,
                    }),
                }
            );

            if (!createCustomerResponse.ok) {
                const errBody = await createCustomerResponse.json().catch(() => ({}));
                const errCode = errBody?.code || '';

                // If the account somehow already exists (race condition or username conflict),
                // treat it as an existing account
                if (errCode === 'registration-error-email-exists' || errCode === 'customer_invalid_email') {
                    // Account exists after all — trigger normal password reset
                    await triggerPasswordReset(WC_API_URL, normalizedEmail);
                    return res.status(200).json({ success: true, message: existingAccountMessage });
                }

                // If username already taken, try with a variant
                if (errCode === 'registration-error-username-exists') {
                    const retryResponse = await fetch(
                        `${WC_API_URL}/wp-json/wc/v3/customers`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Basic ${credentials}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                email: normalizedEmail,
                                first_name: firstName,
                                last_name: lastName,
                                username: normalizedEmail.split('@')[0] + Math.floor(Math.random() * 999),
                                password: randomPassword,
                            }),
                        }
                    );

                    if (!retryResponse.ok) {
                        console.error('Failed to create customer account (retry):', await retryResponse.text());
                        return res.status(200).json({ success: true, message: existingAccountMessage });
                    }
                }

                if (!createCustomerResponse.ok && errCode !== 'registration-error-username-exists') {
                    console.error('Failed to create customer account:', JSON.stringify(errBody));
                    // Don't expose the error, return the generic message
                    return res.status(200).json({ success: true, message: existingAccountMessage });
                }
            }

            // Step 4: Account created — now trigger password reset
            await triggerPasswordReset(WC_API_URL, normalizedEmail);

            return res.status(200).json({
                success: true,
                accountCreated: true,
                message: newAccountMessage,
            });
        }

        // Step 5: Customer already exists — trigger normal password reset
        await triggerPasswordReset(WC_API_URL, normalizedEmail);
        return res.status(200).json({ success: true, message: existingAccountMessage });

    } catch (error) {
        console.error('Forgot-password API error:', error);
        // Even on error, don't expose internals
        return res.status(200).json({ success: true, message: existingAccountMessage });
    }
}

/**
 * Triggers the WordPress password reset by POSTing to wp-login.php
 */
async function triggerPasswordReset(wpUrl, email) {
    try {
        const formData = new URLSearchParams();
        formData.append('user_login', email);
        formData.append('redirect_to', '');
        formData.append('wp-submit', 'Get New Password');

        await fetch(
            `${wpUrl}/wp-login.php?action=lostpassword`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
                redirect: 'manual',
            }
        );
    } catch (err) {
        console.error('Password reset trigger error:', err);
    }
}

/**
 * Generates a cryptographically random password
 */
function generateSecurePassword(length = 24) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
    }
    return password;
}
