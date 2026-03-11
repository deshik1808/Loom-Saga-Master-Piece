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
    CF7_ENDPOINT: 'https://checkout.loomsaga.com/wp/wp-json/contact-form-7/v1/contact-forms/26/feedback',
    CF7_FORM_ID: '26',

    // Map CF7 field names to HTML input IDs for error display
    CF7_FIELD_TO_HTML_ID: {
        'your-name': 'contactName',
        'your-email': 'contactEmail',
        'your-phone': 'contactPhone',
        'your-message': 'contactComment',
    },

    init() {
        const form = document.getElementById('contactForm');
        if (!form) return; // Only runs on the contact page

        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time on-blur validation (fires when user leaves the field)
        this.attachBlurValidation(form);

        console.log('Loom Saga: ContactFormManager initialized');
    },

    /**
     * Attach blur (leave-field) listeners for instant inline validation.
     * Uses the native browser Constraint Validation API so the phone field
     * shows the EXACT same premium tooltip popup as the email field.
     */
    attachBlurValidation(form) {
        const phoneInput = form.querySelector('#contactPhone');
        if (!phoneInput) return;

        phoneInput.addEventListener('blur', () => {
            const val = phoneInput.value.trim();
            if (val && !/^[\d\s\+\-\(\)]{6,20}$/.test(val)) {
                // setCustomValidity + reportValidity = identical native tooltip popup as email
                phoneInput.setCustomValidity('Please enter a valid telephone number (digits, +, -, spaces only).');
                phoneInput.reportValidity();
            } else {
                phoneInput.setCustomValidity(''); // clear — field is valid
            }
        });

        // Clear the custom error as soon as user starts correcting
        phoneInput.addEventListener('input', () => {
            phoneInput.setCustomValidity('');
        });
    },

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;

        // Clear any previous error messages
        this.clearErrors(form);

        // Collect field values
        const name = form.querySelector('#contactName')?.value.trim() || '';
        const email = form.querySelector('#contactEmail')?.value.trim() || '';
        const phone = form.querySelector('#contactPhone')?.value.trim() || '';
        const comment = form.querySelector('#contactComment')?.value.trim() || '';

        // Basic client-side validation (CF7 will also validate)
        if (!email) {
            this.displayInlineError(form.querySelector('#contactEmail'), 'Please enter your email address.');
            return;
        }

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
            formData.append('_wpcf7_version', '6.0'); // This might need to be updated if CF7 version changes significantly
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
            } else if (result.status === 'validation_failed') {
                this.showValidationErrors(form, result.invalid_fields, button, originalText);
            } else {
                // Any other status (e.g., 'mail_failed', 'spam') or unexpected result
                throw new Error(result.message || `Form submission failed with status: ${result.status}`);
            }
        } catch (error) {
            console.error('Contact Form Error:', error);
            this.showGeneralError(button, originalText);
        }
    },

    /**
     * Displays inline validation errors returned by CF7.
     * @param {HTMLFormElement} form - The form element.
     * @param {Array<Object>} invalidFields - Array of objects with 'field' (CF7 tag) and 'message'.
     * @param {HTMLButtonElement} button - The submit button.
     * @param {string} originalText - The original text of the submit button.
     */
    showValidationErrors(form, invalidFields, button, originalText) {
        // Use the native browser Constraint Validation API for all invalid fields
        // so the popup tooltip looks identical to the email field
        let firstEl = null;
        invalidFields.forEach(fieldError => {
            const htmlId = this.CF7_FIELD_TO_HTML_ID[fieldError.field];
            if (htmlId) {
                const inputElement = form.querySelector(`#${htmlId}`);
                if (inputElement) {
                    inputElement.setCustomValidity(fieldError.message);
                    if (!firstEl) firstEl = inputElement;
                }
            }
        });

        // Show native popup on the first invalid field
        if (firstEl) firstEl.reportValidity();

        // Reset button state
        button.disabled = false;
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.style.borderColor = '';
    },

    /**
     * Displays an inline error message below a specific input element.
     * @param {HTMLElement} inputElement - The input or textarea element to display the error for.
     * @param {string} message - The error message to display.
     */
    displayInlineError(inputElement, message) {
        // Update existing error if already there, don't duplicate
        const existing = inputElement.nextElementSibling;
        if (existing && existing.classList.contains('contact-form-error-message')) {
            existing.textContent = message;
            return;
        }

        // Highlight the field border in red
        inputElement.style.borderColor = '#c0392b';

        const errorDiv = document.createElement('div');
        errorDiv.classList.add('contact-form-error-message');
        errorDiv.style.cssText = `
            color: #c0392b;
            font-size: 0.72rem;
            letter-spacing: 0.06em;
            font-family: var(--font-body);
            margin-top: 0.3rem;
            margin-bottom: 0.25rem;
            text-transform: none;
        `;
        errorDiv.textContent = message;
        inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
    },

    /**
     * Clears all previously displayed inline error messages from the form.
     * @param {HTMLFormElement} form - The form element.
     */
    clearErrors(form) {
        // Clear any custom HTML error messages (legacy)
        form.querySelectorAll('.contact-form-error-message').forEach(msg => msg.remove());
        // Also reset native custom validity state on all inputs
        form.querySelectorAll('input, textarea').forEach(el => el.setCustomValidity(''));
    },

    /**
     * Clear the inline error for a single input field.
     */
    clearFieldError(inputElement) {
        const next = inputElement.nextElementSibling;
        if (next && next.classList.contains('contact-form-error-message')) {
            next.remove();
        }
        inputElement.style.borderColor = '';
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
     * Flash an error on the button for general (non-validation) errors, then auto-recover
     * @param {HTMLButtonElement} button - The submit button.
     * @param {string} originalText - The original text of the submit button.
     */
    showGeneralError(button, originalText) {
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
