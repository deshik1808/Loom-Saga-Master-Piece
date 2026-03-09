/**
 * Scroll Animations Module
 * Handles scroll reveal animations using Intersection Observer
 * @module ScrollAnimations
 */

/**
 * Initialize scroll reveal animations
 * Uses Intersection Observer for optimal performance
 */
export function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger');

  if (revealElements.length === 0) return;

  // Mobile/Luxury Refinement: No scroll animations on mobile (≤ 768px)
  // Shows all elements immediately for a faster, app-like feel
  if (window.innerWidth <= 768) {
    revealElements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // Stop observing after reveal
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '50px'
    }
  );

  revealElements.forEach((el) => observer.observe(el));
}

/**
 * Initialize header scroll behavior
 * NOTE: Header scroll is handled by the legacy js/main.js which runs on
 * every page. This function is intentionally a no-op to avoid registering
 * a competing scroll listener with its own lastScrollY state, which caused
 * a race condition making slow scroll-up fail to reveal the header.
 */
export function initHeaderScroll() {
  // Intentionally empty — defers to legacy js/main.js handleHeaderScroll()
}

/**
 * Initialize all scroll-based animations
 */
export function init() {
  initScrollReveal();
  initHeaderScroll();
}

export default { init, initScrollReveal, initHeaderScroll };
