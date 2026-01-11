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
 * Hide on scroll down, show on scroll up
 */
export function initHeaderScroll() {
  const header = document.getElementById('header');
  const footer = document.getElementById('footer');
  
  if (!header) return;
  
  let lastScrollY = window.scrollY;
  let headerVisible = true;
  let ticking = false;
  
  function handleHeaderScroll() {
    const currentScrollY = window.scrollY;
    const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
    const isNearFooter = footer && (currentScrollY + window.innerHeight >= footer.offsetTop - 100);
    
    // Add/remove scrolled class
    if (currentScrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    // Hide header on scroll down (after first 100px)
    if (scrollDirection === 'down' && currentScrollY > 100 && headerVisible) {
      header.classList.add('header-hidden');
      headerVisible = false;
    }
    
    // Show header on scroll up
    if (scrollDirection === 'up' && !headerVisible) {
      header.classList.remove('header-hidden');
      headerVisible = true;
    }
    
    // Hide completely near footer
    if (isNearFooter) {
      header.classList.add('header-hidden');
    }
    
    lastScrollY = currentScrollY;
  }
  
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        handleHeaderScroll();
        ticking = false;
      });
      ticking = true;
    }
  });
}

/**
 * Initialize all scroll-based animations
 */
export function init() {
  initScrollReveal();
  initHeaderScroll();
}

export default { init, initScrollReveal, initHeaderScroll };
