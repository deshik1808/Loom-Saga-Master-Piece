/**
 * Order Confirmation Controller
 * Fetches real order data from WooCommerce via /api/order
 * and renders the confirmation page dynamically.
 */

class OrderConfirmationController {
    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order');

        if (!orderId) {
            window.location.href = 'index.html';
            return;
        }

        // Clear cart immediately — checkout was completed
        localStorage.removeItem('loomSaga_cart');
        localStorage.removeItem('loomSaga_suspendedCart');
        window.dispatchEvent(new Event('cartUpdated'));

        // Show the loading state
        this.showLoading();

        try {
            const res = await fetch(`/api/orders?id=${orderId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data.success && data.order) {
                this.render(data.order);
            } else {
                this.renderFallback(orderId);
            }
        } catch (err) {
            console.warn('Could not fetch order from API, using fallback:', err.message);
            this.renderFallback(orderId);
        }
    }

    showLoading() {
        const orderIdEl = document.getElementById('orderId');
        if (orderIdEl) orderIdEl.textContent = '...';
    }

    /**
     * Render with real WooCommerce order data
     */
    render(order) {
        // Order number — use WooCommerce's own order number
        const orderIdEl = document.getElementById('orderId');
        if (orderIdEl) orderIdEl.textContent = `#${order.number}`;

        // Line items
        const itemsContainer = document.getElementById('orderItems');
        if (itemsContainer) {
            if (order.line_items && order.line_items.length > 0) {
                itemsContainer.innerHTML = order.line_items.map(item => `
                    <div class="oc-item">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="oc-item__img">` : '<div class="oc-item__img-placeholder"></div>'}
                        <div>
                            <p class="oc-item__name">${item.name}</p>
                            <p class="oc-item__qty">Qty: ${item.quantity}</p>
                        </div>
                        <p class="oc-item__price">${order.currency_symbol}${this.formatPrice(parseFloat(item.total))}</p>
                    </div>
                `).join('');
            } else {
                itemsContainer.innerHTML = '<p class="oc-items-empty">Order details sent to your email.</p>';
            }
        }

        // Totals Breakdown
        const totalsContainer = document.querySelector('.oc-totals');
        if (totalsContainer) {
            const sym = order.currency_symbol || '₹';
            const total = parseFloat(order.total || 0);
            const tax = parseFloat(order.total_tax || 0);
            const shipping = parseFloat(order.shipping_total || 0);
            const discount = parseFloat(order.discount_total || 0);

            // Subtotal = (Total - Tax - Shipping + Discount) 
            // Better to calculate from line items to avoid rounding issues if available
            let subtotal = 0;
            if (order.line_items && order.line_items.length > 0) {
                subtotal = order.line_items.reduce((sum, item) => sum + parseFloat(item.total), 0);
            } else {
                subtotal = total - tax - shipping + discount;
            }

            // Subtotal
            const subtotalEl = document.getElementById('confirmSubtotal');
            if (subtotalEl) {
                subtotalEl.textContent = `${sym}${this.formatPrice(subtotal)}`;
                document.getElementById('rowSubtotal')?.classList.remove('oc-hidden');
            }

            // Discount
            if (discount > 0) {
                const discountEl = document.getElementById('confirmDiscount');
                if (discountEl) {
                    discountEl.textContent = `-${sym}${this.formatPrice(discount)}`;
                    document.getElementById('rowDiscount')?.classList.remove('oc-hidden');
                }
            }

            // Shipping
            const shippingEl = document.getElementById('confirmShipping');
            if (shippingEl) {
                shippingEl.textContent = shipping === 0 ? 'Complimentary' : `${sym}${this.formatPrice(shipping)}`;
                if (shipping === 0) shippingEl.classList.add('oc-totals__free');
                else shippingEl.classList.remove('oc-totals__free');
                document.getElementById('rowShipping')?.classList.remove('oc-hidden');
            }

            // Tax
            if (tax > 0) {
                const taxEl = document.getElementById('confirmTax');
                if (taxEl) {
                    taxEl.textContent = `${sym}${this.formatPrice(tax)}`;
                    document.getElementById('rowTax')?.classList.remove('oc-hidden');
                }
            }

            // Grand Total
            const totalEl = document.getElementById('confirmTotal');
            if (totalEl) totalEl.textContent = `${sym}${this.formatPrice(total)}`;
        }

        // Payment method
        const paymentEl = document.getElementById('paymentMethod');
        if (paymentEl) paymentEl.textContent = order.payment_method_title || 'Online Payment';

        // Order status
        const statusEl = document.getElementById('orderStatus');
        if (statusEl) {
            const statusMap = {
                'processing': 'Processing',
                'completed': 'Completed',
                'on-hold': 'On Hold',
                'pending': 'Pending Payment',
                'cancelled': 'Cancelled',
                'refunded': 'Refunded',
                'failed': 'Failed',
            };
            statusEl.textContent = statusMap[order.status] || order.status;
        }

        // Delivery estimate (calculated from order date)
        const deliveryEl = document.getElementById('deliveryDate');
        if (deliveryEl && order.date_created) {
            const orderDate = new Date(order.date_created);
            const min = new Date(orderDate); min.setDate(min.getDate() + 7);
            const max = new Date(orderDate); max.setDate(max.getDate() + 10);
            const opts = { month: 'short', day: 'numeric' };
            deliveryEl.textContent = `${min.toLocaleDateString('en-IN', opts)} - ${max.toLocaleDateString('en-IN', opts)}, ${max.getFullYear()}`;
        }

        // Email confirmation line
        const emailEl = document.getElementById('confirmEmail');
        if (emailEl && order.billing?.email) {
            emailEl.textContent = order.billing.email;
            emailEl.closest('.oc-email-line')?.classList.remove('oc-hidden');
        }

        // Shipping Address
        this.renderAddress('shippingAddressHtml', 'blockShipping', order.shipping);

        // Billing Address
        this.renderAddress('billingAddressHtml', 'blockBilling', order.billing);
    }

    /**
     * Helper to render address HTML
     */
    renderAddress(elementId, blockId, addressObj) {
        if (!addressObj || !addressObj.first_name) return;

        const el = document.getElementById(elementId);
        const block = document.getElementById(blockId);
        if (!el || !block) return;

        const { first_name, last_name, address_1, address_2, city, state, postcode, country } = addressObj;

        const lines = [
            `<strong>${first_name} ${last_name}</strong>`,
            address_1,
            address_2,
            `${city}${state ? `, ${state}` : ''} ${postcode}`,
            country
        ].filter(Boolean); // Remove empty values

        el.innerHTML = lines.join('<br>');
        block.classList.remove('oc-hidden');
    }

    /**
     * Fallback when API is unavailable (dev mode / local)
         */
    renderFallback(orderId) {
        const orderIdEl = document.getElementById('orderId');
        if (orderIdEl) orderIdEl.textContent = `#${orderId}`;

        const itemsContainer = document.getElementById('orderItems');
        if (itemsContainer) {
            itemsContainer.innerHTML = '<p class="oc-items-empty">Order details sent to your email.</p>';
        }

        const totalsContainer = document.querySelector('.oc-totals');
        if (totalsContainer) totalsContainer.classList.add('oc-hidden');

        const paymentEl = document.getElementById('paymentMethod');
        if (paymentEl) paymentEl.textContent = 'Online Payment';

        const deliveryEl = document.getElementById('deliveryDate');
        if (deliveryEl) deliveryEl.textContent = '7-10 business days';
    }

    formatPrice(amount) {
        if (isNaN(amount)) return '0';
        return amount.toLocaleString('en-IN');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.oc-page')) {
        const controller = new OrderConfirmationController();
        controller.init();
    }
});

export default OrderConfirmationController;
