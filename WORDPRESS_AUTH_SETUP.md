# WordPress Auth Setup (Free Hosting Safe Mode)

This project now uses browser-based WordPress auth only (no JWT/API calls).

## What changed

- `login.html` submits directly to `wp-login.php`
- `forgot-password.html` submits directly to `wp-login.php?action=lostpassword`
- `register.html` redirects to WooCommerce `my-account` registration
- Auth pages read WordPress URL from `/api/public-config`
- No frontend `fetch` auth calls
- No JWT plugin required for login/reset on free hosting

## 1) Configure your WordPress URL in environment

Set this env var in your deployment environment:

```bash
WP_BASE_URL=https://your-wordpress-domain.com
```

Local development (`.env.local`) example:

```bash
WP_BASE_URL=https://itirhuta.in/loomsaga-mvp
```

Notes:
- `api/public-config.js` returns this value to frontend at runtime.
- `js/wp-auth-config.js` now acts as a fallback only, not the primary source.

## 2) WordPress dashboard path (step-by-step)

Follow this in order:

1. Login to WordPress Admin (`/wp-admin`).
2. Go to `Settings -> Permalinks`.
3. Select `Post name` and click `Save Changes`.
4. Go to `WooCommerce -> Settings -> Accounts & Privacy`.
5. Enable:
   - `Allow customers to create an account during checkout`
   - `Allow customers to create an account on the "My account" page`
6. Save changes.
7. Go to `Pages -> All Pages`.
8. Ensure a page called `My account` exists.
9. Open `My account` page and confirm it contains shortcode:
   - `[woocommerce_my_account]`
10. Go to `WooCommerce -> Settings -> Advanced`.
11. Confirm `My account page` is mapped to your `My account` page.
12. Go to `WooCommerce -> Settings -> Emails`.
13. Confirm customer emails are enabled (New account, Password reset, etc.).

## 3) Optional but important for reset emails

1. Install plugin `WP Mail SMTP` (free).
2. Configure sender email.
3. Send a test email from plugin settings.
4. Only proceed to production after test email succeeds.

## 4) How login works now

From your custom `login.html` page:
- Email is posted as `log`
- Password is posted as `pwd`
- Form action points to `https://your-wordpress-domain.com/wp-login.php`
- Redirect goes to `https://your-wordpress-domain.com/my-account/`

## 5) How register works now

From your custom `register.html` page:
- User clicks `CONTINUE TO SIGN UP`
- User is redirected to `https://your-wordpress-domain.com/my-account/`
- WooCommerce handles secure account creation and stores customer data in WordPress

## 6) How forgot password works now

From your custom `forgot-password.html` page:
- Email is posted as `user_login`
- Form action points to `https://your-wordpress-domain.com/wp-login.php?action=lostpassword`

WordPress handles email sending and confirmation page.

## 7) Customer data requirement

This approach keeps customer auth inside WordPress/WooCommerce, so customer/account data stays in the WordPress dashboard as required.

## 8) Where to see customer data

In WordPress Admin:
1. `WooCommerce -> Customers` (customer list, spend, orders)
2. `Users -> All Users` (WP user accounts)
3. `WooCommerce -> Orders` (order history per customer)

## 9) Live testing checklist

1. Set `WP_BASE_URL` in env.
2. Open `register.html`, click continue, create account in My Account page.
3. Verify user appears in `Users -> All Users`.
4. Open `login.html`, sign in.
5. Open `forgot-password.html`, request reset.
6. Verify reset email arrives and link works.
