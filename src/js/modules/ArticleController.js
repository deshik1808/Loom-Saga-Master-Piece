import blogService, { BlogService } from './BlogService.js';

// Read slug from URL
const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');

const loadingEl = document.getElementById('articleLoading');
const contentEl = document.getElementById('articleContent');
const notFoundEl = document.getElementById('articleNotFound');

if (!slug) {
    // No slug provided — show not found
    if (loadingEl) loadingEl.style.display = 'none';
    if (notFoundEl) notFoundEl.style.display = '';
} else {
    loadArticle(slug);
}

async function loadArticle(slug) {
    const { post, relatedPosts } = await blogService.getPost(slug);

    if (!post) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (notFoundEl) notFoundEl.style.display = '';
        return;
    }

    // Update page meta
    document.title = `${BlogService.stripHtml(post.title)} | Loom Saga`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', BlogService.truncate(BlogService.stripHtml(post.excerpt || post.content), 160));
    }

    // Hero image
    const heroImg = document.getElementById('articleHeroImg');
    if (heroImg) {
        if (post.featuredImage) {
            heroImg.src = post.featuredImage;
            heroImg.alt = post.featuredImageAlt || post.title;
            heroImg.onload = () => {
                heroImg.parentElement.classList.remove('luxury-shimmer');
            };
        } else {
            heroImg.parentElement.style.display = 'none';
        }
    }

    // Category badge
    const catBadge = document.getElementById('articleCategory');
    if (catBadge) catBadge.textContent = post.categoryName;

    // Title
    const titleEl = document.getElementById('articleTitle');
    if (titleEl) titleEl.innerHTML = post.title;

    // Date
    const dateEl = document.getElementById('articleDate');
    if (dateEl) dateEl.textContent = post.formattedDate;

    // Body content — full HTML from WordPress Gutenberg
    const bodyEl = document.getElementById('articleBody');
    if (bodyEl) bodyEl.innerHTML = post.content;

    // Share links
    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(BlogService.stripHtml(post.title));

    const whatsappBtn = document.getElementById('shareWhatsApp');
    if (whatsappBtn) {
        whatsappBtn.href = `https://wa.me/?text=${pageTitle}%20${pageUrl}`;
        whatsappBtn.target = '_blank';
    }

    const fbBtn = document.getElementById('shareFacebook');
    if (fbBtn) {
        fbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
        fbBtn.target = '_blank';
    }

    // Premium Transition: Fade out loading, Fade in content
    if (loadingEl) {
        loadingEl.classList.add('fade-out-premium');
        setTimeout(() => {
            loadingEl.style.display = 'none';
            if (contentEl) {
                contentEl.style.display = '';
                contentEl.classList.add('fade-in-premium');
            }
        }, 600);
    } else {
        if (contentEl) {
            contentEl.style.display = '';
            contentEl.classList.add('fade-in-premium');
        }
    }

    // Related articles
    let displayPosts = relatedPosts || [];

    // Fallback 1: If no related posts in the same category, fetch latest posts overall
    if (displayPosts.length === 0) {
        try {
            const allPostsRes = await blogService.getPosts(1, 4); // fetch 4 in case 1 is the current post
            if (allPostsRes && allPostsRes.posts) {
                // filter out current post and take up to 3
                displayPosts = allPostsRes.posts.filter(p => p.id !== post.id).slice(0, 3);
            }
        } catch (e) {
            console.warn("Could not fetch fallback posts", e);
        }
    }

    // Fallback 2: Static placeholders if API completely fails or has no other posts
    if (displayPosts.length === 0) {
        displayPosts = [
            {
                link: "fashion-insights.html",
                featuredImage: "https://placehold.co/400x300/8d6e63/ffffff?text=Secrets+of+Chic",
                title: "Secrets of Chic: Modern Saree Styling Tips",
                categoryName: "Trends"
            },
            {
                link: "fashion-insights.html",
                featuredImage: "https://placehold.co/400x300/7cb342/ffffff?text=Monsoon+Guide",
                title: "Monsoon Saree Guide: Colours, Fabrics & Care",
                categoryName: "Seasonal"
            },
            {
                link: "fashion-insights.html",
                featuredImage: "https://placehold.co/400x300/e8a040/ffffff?text=Indo+Western",
                title: "Indo-Western Style: How the New-Age Woman Drapes",
                categoryName: "Style Guide"
            }
        ];
    }

    if (displayPosts.length > 0) {
        const relatedGrid = document.getElementById('relatedGrid');
        if (relatedGrid) {
            relatedGrid.innerHTML = displayPosts.map(rp => `
        <article class="insight-card">
          <a href="${rp.link}" class="insight-card-link">
            <div class="insight-card-image">
              <img src="${rp.featuredImage || 'https://placehold.co/400x300/8d6e63/ffffff?text=Loom+Saga'}"
                   alt="${rp.title}" loading="lazy">
            </div>
            <div class="insight-card-content">
              <span class="insight-card-category">${rp.categoryName}</span>
              <h3 class="insight-card-title">${rp.title}</h3>
            </div>
          </a>
        </article>
      `).join('');
        }
        const relatedSection = document.getElementById('relatedSection');
        if (relatedSection) relatedSection.style.display = '';
    }
}
