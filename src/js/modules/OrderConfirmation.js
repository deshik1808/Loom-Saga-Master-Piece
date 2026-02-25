/**
 * Order Confirmation Controller
 * Handles the display and logic for the post-checkout order confirmation page.
 */

class OrderConfirmationController {
    init() {
        this.renderOrderDetails();
    }

    renderOrderDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderIdFromUrl = urlParams.get('order');

        let orderData = JSON.parse(localStorage.getItem('loomSaga_lastOrder'));

        // If returning straight from checkout with an ID but no local order data
        if (orderIdFromUrl && !orderData) {
            // Create a synthetic order data object so the page renders beautifully
            orderData = {
                orderId: 'LS-' + orderIdFromUrl.padStart(6, '0'),
                items: [],
                subtotal: 0,
                tax: 0,
                total: 0,
                shipping: { fullName: 'Customer', address1: '', city: '', state: '', pincode: '', phone: '' },
                paymentMethod: 'Online Payment',
                orderDate: new Date().toISOString()
            };
            // We could fetch actual details from a secure endpoints in the future
        } else if (!orderData && !orderIdFromUrl) {
            window.location.href = 'index.html';
            return;
        }

        // Automatically empty the shopping cart (and suspended cart) since the order was successful
        localStorage.removeItem('loomSaga_cart');
        localStorage.removeItem('loomSaga_suspendedCart');
        window.dispatchEvent(new Event('cartUpdated'));

        // Display order ID
        document.getElementById('orderId').textContent = orderData.orderId;

        // Display order items
        const orderItemsContainer = document.getElementById('orderItems');
        let itemsHtml = '';

        orderData.items.forEach(item => {
            itemsHtml += `
          <div class="order-item">
            <img src="${item.image}" alt="${item.name}" class="order-item-image">
            <div class="order-item-info">
              <p class="order-item-name">${item.name}</p>
              <p class="order-item-qty">Qty: ${item.quantity}</p>
            </div>
            <p class="order-item-price">₹${this.formatPrice(item.price * item.quantity)}</p>
          </div>
        `;
        });
        orderItemsContainer.innerHTML = itemsHtml;

        // Display totals
        document.getElementById('confirmSubtotal').textContent = `₹${this.formatPrice(orderData.subtotal)}`;
        document.getElementById('confirmTax').textContent = `₹${this.formatPrice(orderData.tax)}`;
        document.getElementById('confirmTotal').textContent = `₹${this.formatPrice(orderData.total)}`;

        // Display shipping address
        if (orderData.shipping && document.getElementById('shippingAddress')) {
            const shipping = orderData.shipping;
            document.getElementById('shippingAddress').innerHTML = `
            <p><strong>${shipping.fullName}</strong></p>
            <p>${shipping.address1}</p>
            ${shipping.address2 ? `<p>${shipping.address2}</p>` : ''}
            <p>${shipping.city}, ${shipping.state} - ${shipping.pincode}</p>
            <p>Phone: ${shipping.phone}</p>
          `;
        }

        // Display payment method
        if (document.getElementById('paymentMethod')) {
            const paymentMethod = orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';
            document.getElementById('paymentMethod').textContent = paymentMethod;
        }

        // Calculate estimated delivery date
        if (document.getElementById('deliveryDate')) {
            const orderDate = new Date(orderData.orderDate);
            const minDelivery = new Date(orderDate);
            const maxDelivery = new Date(orderDate);
            minDelivery.setDate(minDelivery.getDate() + 7);
            maxDelivery.setDate(maxDelivery.getDate() + 10);

            const options = { month: 'short', day: 'numeric' };
            const deliveryText = `${minDelivery.toLocaleDateString('en-IN', options)} - ${maxDelivery.toLocaleDateString('en-IN', options)}, ${maxDelivery.getFullYear()}`;
            document.getElementById('deliveryDate').textContent = deliveryText;
        }
    }

    // Helper function
    formatPrice(amount) {
        return amount.toLocaleString('en-IN');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.confirmation-page')) {
        const controller = new OrderConfirmationController();
        controller.init();
    }
});

export default OrderConfirmationController;
