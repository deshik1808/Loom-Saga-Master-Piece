/**
 * NewsletterManager.js
 * Handles the newsletter subscription form and communication with the API
 */

const NewsletterManager = {
  init() {
    const forms = document.querySelectorAll('#newsletterForm, .insights-newsletter-form');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    });
    
    console.log('Loom Saga: NewsletterManager initialized');
  },

  async handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const email = input.value;

    if (!email) return;

    // Visual feedback: disable button and show loading state
    const originalBtnText = button.textContent;
    button.disabled = true;
    button.textContent = 'Joining...';

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        // Success!
        this.showSuccess(form, input, button);
      } else {
        // Handle server errors
        console.error('Server responded with error:', result);
        throw new Error(result.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Newsletter Error Details:', error);
      this.showError(button, originalBtnText);
    }
  },

  showSuccess(form, input, button) {
    // 1. Clear the input immediately so the email doesn't "reappear"
    input.value = '';
    
    // 2. Smoothly fade out the entire form content
    form.style.transition = 'opacity 0.4s ease';
    form.style.opacity = '0';

    setTimeout(() => {
      // 3. Replace the form's inner parts with our premium message
      form.innerHTML = `
        <div class="newsletter-success-premium">
          <svg class="success-tick" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Thanks for subscribing</span>
        </div>
      `;
      // 4. Fade the whole thing back in
      form.style.opacity = '1';
    }, 400);
  },

  showError(button, originalText) {
    button.textContent = 'Error!';
    button.style.backgroundColor = '#f44336';
    
    setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
      button.style.backgroundColor = '';
    }, 3000);
  }
};

export default NewsletterManager;
