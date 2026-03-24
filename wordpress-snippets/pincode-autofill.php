<?php
/**
 * Loom Saga – Pincode Auto-Fill on WooCommerce Checkout
 *
 * Supports BOTH classic shortcode checkout AND block-based checkout.
 *
 * When the user types a 6-digit Indian PIN code in either the billing or
 * shipping postcode field, this script calls the India Post Pincode API
 * (https://api.postalpincode.in/) and auto-populates City and State.
 *
 * HOW TO ADD THIS TO WORDPRESS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Option A (Recommended) – Code Snippets / WPCode plugin:
 *   1. Go to  WP Admin → Snippets → Add New
 *   2. Paste the entire contents of this file
 *   3. Set "Run snippet everywhere" → Only run on site front-end
 *   4. Activate & Save
 *
 * Option B – functions.php of your active child-theme:
 *   Paste this file's contents at the bottom of:
 *   wp-content/themes/YOUR-CHILD-THEME/functions.php
 */

/**
 * Enqueue / inline the pincode auto-fill script.
 *
 * Strategy:
 *   Block checkout  → no 'wc-checkout' handle exists; we add the script
 *                     unconditionally on checkout pages and let the JS guard itself.
 *   Classic checkout→ the 'wc-checkout' handle is present so we attach inline.
 *
 * Using wp_footer with a late priority ensures both checkout flavours are covered.
 */
add_action( 'wp_footer', 'loom_saga_pincode_autofill_footer', 99 );
function loom_saga_pincode_autofill_footer() {
    // Only run on checkout pages (classic + block).
    if ( function_exists( 'is_checkout' ) && ! is_checkout() ) {
        return;
    }
    echo '<script id="ls-pincode-autofill">' . loom_saga_pincode_autofill_js() . '</script>';
}

/**
 * Returns the JavaScript string for the pincode auto-fill feature.
 *
 * Compatible with:
 *   - Classic checkout: IDs like  billing_postcode, billing_city, billing_state
 *   - Block checkout:   IDs like  billing-postcode, billing-city, billing-state
 *                       (or aria-label / autocomplete attribute fallbacks)
 */
function loom_saga_pincode_autofill_js() {
    return <<<'JS'
(function () {
  'use strict';

  /* ── Indian state name → WooCommerce 2-letter code ─── */
  var STATE_MAP = {
    "Andhra Pradesh":                           "AP",
    "Arunachal Pradesh":                        "AR",
    "Assam":                                    "AS",
    "Bihar":                                    "BR",
    "Chhattisgarh":                             "CT",
    "Goa":                                      "GA",
    "Gujarat":                                  "GJ",
    "Haryana":                                  "HR",
    "Himachal Pradesh":                         "HP",
    "Jharkhand":                                "JH",
    "Karnataka":                                "KA",
    "Kerala":                                   "KL",
    "Madhya Pradesh":                           "MP",
    "Maharashtra":                              "MH",
    "Manipur":                                  "MN",
    "Meghalaya":                                "ML",
    "Mizoram":                                  "MZ",
    "Nagaland":                                 "NL",
    "Odisha":                                   "OR",
    "Punjab":                                   "PB",
    "Rajasthan":                                "RJ",
    "Sikkim":                                   "SK",
    "Tamil Nadu":                               "TN",
    "Telangana":                                "TG",
    "Tripura":                                  "TR",
    "Uttar Pradesh":                            "UP",
    "Uttarakhand":                              "UK",
    "West Bengal":                              "WB",
    "Andaman and Nicobar Islands":              "AN",
    "Chandigarh":                               "CH",
    "Dadra and Nagar Haveli and Daman and Diu": "DN",
    "Delhi":                                    "DL",
    "Jammu and Kashmir":                        "JK",
    "Ladakh":                                   "LA",
    "Lakshadweep":                              "LD",
    "Puducherry":                               "PY"
  };

  /* ── Field resolution: supports classic (_) and block (-) IDs ── */

  /**
   * Find an input/select by trying multiple selector strategies.
   * @param {string} type  - "postcode" | "city" | "state"
   * @param {string} group - "billing" | "shipping"
   */
  function findField(type, group) {
    var selectors = [
      // Classic WooCommerce (underscores)
      '#' + group + '_' + type,
      // Block WooCommerce (hyphens, full id)
      '#' + group + '-' + type,
      // Block WooCommerce input inside labelled wrapper
      'input[id*="' + group + '"][id*="' + type + '"]',
      'select[id*="' + group + '"][id*="' + type + '"]',
      // autocomplete attribute (most reliable for block checkout)
      'input[autocomplete="' + (type === 'postcode' ? 'postal-code' : type === 'city' ? (group === 'billing' ? 'billing address-level2' : 'shipping address-level2') : '') + '"]',
    ];
    for (var i = 0; i < selectors.length; i++) {
      if (!selectors[i]) continue;
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  /**
   * Find the postcode input specifically (bit more targeted).
   */
  function findPostcodeInput(group) {
    // Try common patterns
    var patterns = [
      '#' + group + '_postcode',        // classic
      '#' + group + '-postcode',        // block
      'input[id$="-postcode"]',         // block generic
      'input[autocomplete="postal-code"]',
      'input[name="' + group + '_postcode"]',
      'input[placeholder*="PIN"]',
      'input[placeholder*="postcode"]',
      'input[placeholder*="Postcode"]',
      'input[placeholder*="PIN Code"]',
    ];
    for (var i = 0; i < patterns.length; i++) {
      var el = document.querySelector(patterns[i]);
      if (el) return el;
    }
    return null;
  }

  /* ── Status badge ─────────────────────────────────── */

  function getOrCreateBadge(postcodeInput) {
    if (!postcodeInput) return null;
    var wrap = postcodeInput.closest('.form-row, .wc-block-components-form-token-field, [class*="postcode"], [class*="postal"]');
    if (!wrap) wrap = postcodeInput.parentElement;
    if (!wrap) return null;

    var existing = wrap.querySelector('.ls-pin-status');
    if (existing) return existing;

    var badge = document.createElement('span');
    badge.className = 'ls-pin-status';
    wrap.appendChild(badge);
    return badge;
  }

  function setStatus(badge, state, message) {
    if (!badge) return;
    badge.className = 'ls-pin-status' + (state ? ' ls-pin-' + state : '');
    badge.textContent = message;
  }

  /* ── WooCommerce update trigger ───────────────────── */

  function triggerWooUpdate() {
    if (window.jQuery && window.jQuery(document.body).trigger) {
      window.jQuery(document.body).trigger('update_checkout');
    }
    // Block checkout uses custom events
    document.body.dispatchEvent(new CustomEvent('wc-blocks_cart_item_quantity_changed', { bubbles: true }));
  }

  /* ── Fill a React/block controlled input ─────────── */

  /**
   * Block-checkout inputs are React-controlled. A plain value assignment
   * won't trigger React's synthetic onChange. We need the native input
   * value setter trick.
   */
  function setNativeValue(el, value) {
    if (!el) return;
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype,
      'value'
    );
    if (nativeInputValueSetter && nativeInputValueSetter.set) {
      nativeInputValueSetter.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    // React synthetic event
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }

  /* ── Core lookup ──────────────────────────────────── */

  async function lookupPincode(pincode, group, badge) {
    setStatus(badge, 'loading', '⏳ Looking up…');
    try {
      var res  = await fetch('https://api.postalpincode.in/pincode/' + pincode);
      var data = await res.json();

      if (
        data &&
        data[0] &&
        data[0].Status === 'Success' &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        var po        = data[0].PostOffice[0];
        var district  = po.District;
        var stateName = po.State;
        var stateCode = STATE_MAP[stateName] || '';

        /* City */
        var cityEl = findField('city', group);
        if (cityEl) {
          setNativeValue(cityEl, district);
        }

        /* State */
        var stateEl = findField('state', group);
        if (stateEl) {
          if (stateEl.tagName === 'SELECT') {
            var targetVal = stateCode || '';
            // Try code first
            if (stateCode && stateEl.querySelector('option[value="' + stateCode + '"]')) {
              setNativeValue(stateEl, stateCode);
            } else {
              // Fallback: match full name
              var matched = Array.from(stateEl.options).find(function(o) {
                return o.text.trim().toLowerCase() === stateName.toLowerCase();
              });
              if (matched) setNativeValue(stateEl, matched.value);
            }
          } else {
            setNativeValue(stateEl, stateName);
          }
        }

        setStatus(badge, 'success', '✓ ' + district + ', ' + stateName);
        triggerWooUpdate();

      } else {
        setStatus(badge, 'error', '✗ PIN not found');
      }
    } catch (err) {
      console.warn('[Loom Saga] Pincode lookup failed:', err);
      setStatus(badge, 'error', '✗ Could not verify');
    }
  }

  /* ── Wire up one group ────────────────────────────── */

  function wireGroup(group) {
    var input = findPostcodeInput(group);
    if (!input || input.dataset.lsPinBound) return;  // skip if already bound
    input.dataset.lsPinBound = '1';

    var badge = getOrCreateBadge(input);
    var timer;

    input.addEventListener('input', function () {
      clearTimeout(timer);
      var pin = this.value.replace(/\D/g, '');
      if (pin.length < 6) { setStatus(badge, '', ''); return; }
      timer = setTimeout(function () { lookupPincode(pin, group, badge); }, 400);
    });
  }

  /* ── Init ─────────────────────────────────────────── */

  function init() {
    wireGroup('billing');
    wireGroup('shipping');
  }

  // Classic WooCommerce: re-bind after AJAX checkout refresh
  if (window.jQuery) {
    window.jQuery(document).on('updated_checkout', init);
  }

  // Block checkout: observe DOM for when fields are rendered/re-rendered
  var _observer = new MutationObserver(function(mutations) {
    for (var m = 0; m < mutations.length; m++) {
      if (mutations[m].addedNodes.length) {
        init();
        break;
      }
    }
  });
  _observer.observe(document.body, { childList: true, subtree: true });

  // Initial bind (fires once DOM is ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
JS;
}

/**
 * Inject status-badge CSS on checkout pages (both classic & block).
 */
add_action( 'wp_head', 'loom_saga_pincode_status_styles', 99 );
function loom_saga_pincode_status_styles() {
    if ( function_exists( 'is_checkout' ) && ! is_checkout() ) {
        return;
    }
    ?>
    <style id="ls-pin-styles">
      /* Loom Saga: Pincode auto-fill status badge */
      .ls-pin-status {
        display: block;
        font-size: 12px;
        margin-top: 4px;
        min-height: 18px;
        transition: color 0.2s ease;
      }
      .ls-pin-loading { color: #888; }
      .ls-pin-success { color: #2e7d32; font-weight: 600; }
      .ls-pin-error   { color: #c62828; }
    </style>
    <?php
}
