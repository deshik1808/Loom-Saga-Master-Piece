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

        // Total
        const totalEl = document.getElementById('confirmTotal');
        if (totalEl) totalEl.textContent = `${order.currency_symbol}${this.formatPrice(parseFloat(order.total))}`;

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

        const totalEl = document.getElementById('confirmTotal');
        if (totalEl) totalEl.closest('.oc-totals')?.classList.add('oc-hidden');

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
