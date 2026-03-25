<?php
/**
 * Loom Saga – Checkout Pre-fill & Auto-Login from Headless Redirect
 *
 * CRITICAL: WooCommerce Block Checkout is React-based. PHP filters like
 * woocommerce_checkout_get_value DO NOT work for block checkout.
 * This snippet uses a JavaScript approach (native setter trick) to force-fill
 * React-controlled inputs, identical to how pincode-autofill works.
 *
 * HOW TO ADD THIS TO WORDPRESS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Go to WP Admin → WPCode → Add New.
 * 2. Title: "Loom Saga - Checkout Handler".
 * 3. Code Type: PHP Snippet.
 * 4. Paste this entire file contents.
 * 5. Set to "Run everywhere" → Activate.
 */

// ─── 1. AUTO-LOGIN FROM JWT TOKEN (PHP, server-side) ────────────────────────

add_action( 'init', 'ls_handle_jwt_auto_login' );
function ls_handle_jwt_auto_login() {
    if ( is_user_logged_in() || empty( $_GET['ls_token'] ) || is_admin() ) {
        return;
    }

    $token = sanitize_text_field( $_GET['ls_token'] );

    // Validate the JWT by calling our own WP REST API internally
    $response = wp_remote_get( get_rest_url( null, '/wp/v2/users/me' ), array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $token
        ),
        'sslverify' => false, // needed for some server configs
    ));

    if ( ! is_wp_error( $response ) && (int) wp_remote_retrieve_response_code( $response ) === 200 ) {
        $user_data = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( isset( $user_data['id'] ) ) {
            wp_set_current_user( (int) $user_data['id'] );
            wp_set_auth_cookie( (int) $user_data['id'] );
        }
    }
}

// ─── 2. SYNC CART ITEMS (PHP, server-side) ──────────────────────────────────

add_action( 'template_redirect', 'ls_sync_cart_from_url' );
function ls_sync_cart_from_url() {
    if ( ! function_exists( 'is_checkout' ) || ! is_checkout() ) return;
    if ( empty( $_GET['ls_checkout'] ) ) return;
    if ( ! function_exists( 'WC' ) || ! WC()->cart ) return;

    $ids  = array_map( 'intval', explode( ',', sanitize_text_field( $_GET['ls_checkout'] ) ) );
    $qtys = isset( $_GET['ls_qty'] )
        ? array_map( 'intval', explode( ',', sanitize_text_field( $_GET['ls_qty'] ) ) )
        : array();

    WC()->cart->empty_cart();
    foreach ( $ids as $index => $product_id ) {
        if ( $product_id > 0 ) {
            $qty = isset( $qtys[ $index ] ) && $qtys[ $index ] > 0 ? $qtys[ $index ] : 1;
            WC()->cart->add_to_cart( $product_id, $qty );
        }
    }
}

// ─── 3. PRE-FILL VIA JAVASCRIPT (works for Block & Classic checkout) ─────────
//
// Because WooCommerce Block Checkout is React-controlled, PHP filters DON'T work.
// We inject JavaScript that reads URL params and uses the React native setter
// trick to force the values into React's internal state — same approach as pincode.

add_action( 'wp_footer', 'ls_checkout_prefill_js', 98 );
function ls_checkout_prefill_js() {
    if ( ! function_exists( 'is_checkout' ) || ! is_checkout() ) return;
    ?>
<script id="ls-checkout-prefill">
(function () {
  'use strict';

  /* ── Read URL params ─────────────────────────────── */
  var params = new URLSearchParams(window.location.search);
  var prefill = {
    email:     params.get('billing_email')      || '',
    firstName: params.get('billing_first_name') || '',
    lastName:  params.get('billing_last_name')  || '',
    phone:     params.get('billing_phone')      || '',
  };

  // Nothing to do if no params were passed
  if (!prefill.email && !prefill.firstName && !prefill.lastName) return;

  /* ── Native React setter trick ───────────────────── */
  function setNativeValue(el, value) {
    if (!el || !value) return;
    var proto = el.tagName === 'SELECT'
      ? window.HTMLSelectElement.prototype
      : window.HTMLInputElement.prototype;
    var nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }

  /* ── Find a field using multiple selector strategies ── */
  function findField(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      if (!selectors[i]) continue;
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  /* ── Fill all known fields ───────────────────────── */
  function fillFields() {
    // Email — Block checkout uses input[type="email"] inside contact section
    if (prefill.email) {
      var emailEl = findField([
        'input[type="email"][autocomplete="email"]',
        '#email',
        '#billing_email',
        '#billing-email',
        'input[id*="email"]',
        'input[name="billing_email"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="Email" i]',
        '.wc-block-components-form input[type="email"]',
      ]);
      if (emailEl && !emailEl.value) {
        setNativeValue(emailEl, prefill.email);
        console.log('[Loom Saga] Email pre-filled:', prefill.email);
      }
    }

    // First Name
    if (prefill.firstName) {
      var firstEl = findField([
        'input[autocomplete="given-name"]',
        'input[autocomplete="shipping given-name"]',
        'input[autocomplete="billing given-name"]',
        '#billing_first_name',
        '#billing-first_name',
        'input[name="billing_first_name"]',
        'input[id*="first"][id*="name"]',
        'input[placeholder*="First name" i]',
        'input[placeholder*="first name" i]',
      ]);
      if (firstEl && !firstEl.value) {
        setNativeValue(firstEl, prefill.firstName);
        console.log('[Loom Saga] First name pre-filled:', prefill.firstName);
      }
    }

    // Last Name
    if (prefill.lastName) {
      var lastEl = findField([
        'input[autocomplete="family-name"]',
        'input[autocomplete="shipping family-name"]',
        'input[autocomplete="billing family-name"]',
        '#billing_last_name',
        '#billing-last_name',
        'input[name="billing_last_name"]',
        'input[id*="last"][id*="name"]',
        'input[placeholder*="Last name" i]',
        'input[placeholder*="last name" i]',
      ]);
      if (lastEl && !lastEl.value) {
        setNativeValue(lastEl, prefill.lastName);
        console.log('[Loom Saga] Last name pre-filled:', prefill.lastName);
      }
    }

    // Phone
    if (prefill.phone) {
      var phoneEl = findField([
        'input[type="tel"]',
        'input[autocomplete="tel"]',
        '#billing_phone',
        '#billing-phone',
        'input[name="billing_phone"]',
        'input[id*="phone"]',
        'input[placeholder*="phone" i]',
        'input[placeholder*="Phone" i]',
      ]);
      if (phoneEl && !phoneEl.value) {
        setNativeValue(phoneEl, prefill.phone);
      }
    }
  }

  /* ── Run with retries (Block Checkout renders asynchronously) ── */
  var attempts = 0;
  var maxAttempts = 40; // Try for ~4 seconds
  var interval = setInterval(function () {
    attempts++;
    fillFields();

    // Stop retrying once email is filled OR we've hit the limit
    var emailEl = document.querySelector('input[type="email"]') ||
                  document.querySelector('#email') ||
                  document.querySelector('#billing_email');
    if ((emailEl && emailEl.value) || attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 100);

  // Also run once on DOMContentLoaded as a fallback
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fillFields);
  } else {
    fillFields();
  }

  // Re-run when block checkout re-renders (MutationObserver)
  var _observer = new MutationObserver(function(mutations) {
    for (var m = 0; m < mutations.length; m++) {
      if (mutations[m].addedNodes.length) {
        fillFields();
        break;
      }
    }
  });
  _observer.observe(document.body, { childList: true, subtree: true });

})();
</script>
    <?php
}
?>
