/**
 * ContactFormManager.js
 * Handles the contact form submission on contact.html
 *
 * Submits directly to the WordPress Contact Form 7 REST API.
 * This avoids the need for a Vercel serverless function proxy,
 * keeping it simple and working in both local dev and production.
 */

const ContactFormManager = {
    // CF7 endpoint config — same WP site used by the rest of the project
    CF7_ENDPOINT: 'https://itirhuta.in/loomsaga-mvp/wp-json/contact-form-7/v1/contact-forms/112/feedback',
    CF7_FORM_ID: '112',

    init() {
        const form = document.getElementById('contactForm');
        if (!form) return; // Only runs on the contact page

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        console.log('Loom Saga: ContactFormManager initialized');
    },

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;

        // Collect field values
        const name = form.querySelector('#contactName')?.value.trim() || '';
        const email = form.querySelector('#contactEmail')?.value.trim() || '';
        const phone = form.querySelector('#contactPhone')?.value.trim() || '';
        const comment = form.querySelector('#contactComment')?.value.trim() || '';

        if (!email) return;

        // Button loading state
        const button = form.querySelector('.contact-submit-btn');
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending...';

        try {
            // Build multipart/form-data (required by CF7 REST API)
            const formData = new FormData();

            // CF7 internal fields
            formData.append('_wpcf7', this.CF7_FORM_ID);
            formData.append('_wpcf7_version', '6.0');
            formData.append('_wpcf7_unit_tag', `wpcf7-f${this.CF7_FORM_ID}-o1`);
            formData.append('_wpcf7_locale', 'en_US');

            // User-submitted fields (match CF7 form tag names)
            formData.append('your-name', name);
            formData.append('your-email', email);
            formData.append('your-phone', phone);
            formData.append('your-message', comment);

            const response = await fetch(this.CF7_ENDPOINT, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.status === 'mail_sent') {
                this.showSuccess(form, button);
            } else {
                throw new Error(result.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Contact Form Error:', error);
            this.showError(button, originalText);
        }
    },

    /**
     * Replace the form with a premium "thank you" message
     */
    showSuccess(form, button) {
        form.style.transition = 'opacity 0.4s ease';
        form.style.opacity = '0';

        setTimeout(() => {
            form.innerHTML = `
        <div class="contact-success-message" style="
          text-align: center;
          padding: 3rem 1rem;
          opacity: 0;
          transition: opacity 0.5s ease;
        ">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
               stroke="var(--gold, #b8860b)" stroke-width="1.5"
               style="margin-bottom: 1rem;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="16 9 10.5 14.5 8 12"></polyline>
          </svg>
          <h3 style="
            font-family: var(--font-heading, 'Cormorant Garamond', serif);
            font-size: 1.6rem;
            font-weight: 400;
            letter-spacing: 0.08em;
            margin-bottom: 0.5rem;
            color: var(--text-primary, #1a1a1a);
          ">THANK YOU</h3>
          <p style="
            font-family: var(--font-body, 'Montserrat', sans-serif);
            font-size: 0.85rem;
            letter-spacing: 0.04em;
            color: var(--text-secondary, #666);
          ">We've received your message and will get back to you shortly.</p>
        </div>
      `;
            form.style.opacity = '1';

            // Animate the inner message in
            requestAnimationFrame(() => {
                const msg = form.querySelector('.contact-success-message');
                if (msg) msg.style.opacity = '1';
            });
        }, 400);
    },

    /**
     * Flash an error on the button, then auto-recover
     */
    showError(button, originalText) {
        button.textContent = 'Error — try again';
        button.style.backgroundColor = '#c0392b';
        button.style.borderColor = '#c0392b';

        setTimeout(() => {
            button.disabled = false;
            button.textContent = originalText;
            button.style.backgroundColor = '';
            button.style.borderColor = '';
        }, 3000);
    },
};

export default ContactFormManager;
