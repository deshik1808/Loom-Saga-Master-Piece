import blogService, { BlogService } from './BlogService.js';

const POSTS_PER_PAGE = 9;
let currentPage = 1;
let totalPages = 1;

const grid = document.getElementById('insightsGrid');
const emptyState = document.getElementById('insightsEmpty');
const paginationEl = document.getElementById('pagination');
const paginationNumbers = document.getElementById('paginationNumbers');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

/**
 * Render a single article card.
 */
function renderCard(post) {
    const cleanExcerpt = BlogService.truncate(BlogService.stripHtml(post.excerpt), 120);
    return `
    <article class="insight-card">
      <a href="${post.link}" class="insight-card-link">
        <div class="insight-card-image">
          <img src="${post.featuredImage || 'https://placehold.co/400x300/8d6e63/ffffff?text=Loom+Saga'}"
               alt="${post.featuredImageAlt || post.title}"
               loading="lazy">
        </div>
        <div class="insight-card-content">
          <span class="insight-card-category">${post.categoryName}</span>
          <h2 class="insight-card-title">${post.title}</h2>
          <p class="insight-card-excerpt">${cleanExcerpt}</p>
          <span class="insight-card-date">${post.formattedDate}</span>
        </div>
      </a>
    </article>
  `;
}

/**
 * Build pagination controls.
 */
function renderPagination() {
    if (totalPages <= 1) {
        if (paginationEl) paginationEl.style.display = 'none';
        return;
    }
    if (paginationEl) paginationEl.style.display = '';
    if (paginationNumbers) paginationNumbers.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'pagination-number' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            loadPosts();
            window.scrollTo({ top: grid.offsetTop - 120, behavior: 'smooth' });
        });
        if (paginationNumbers) paginationNumbers.appendChild(btn);
    }

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

/**
 * Fetch posts and render them.
 */
async function loadPosts() {
    if (!grid) return;
    // Show skeleton
    grid.querySelectorAll('.skeleton-card').forEach(el => el.style.display = '');

    const data = await blogService.getPosts({ perPage: POSTS_PER_PAGE, page: currentPage });

    // Remove skeletons
    grid.querySelectorAll('.skeleton-card').forEach(el => el.remove());

    if (!data.posts || data.posts.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = '';
        if (paginationEl) paginationEl.style.display = 'none';
        return;
    }

    totalPages = data.totalPages || 1;
    grid.innerHTML = data.posts.map(renderCard).join('');
    renderPagination();
}

// Pagination arrow handlers
prevBtn?.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadPosts();
        window.scrollTo({ top: grid.offsetTop - 120, behavior: 'smooth' });
    }
});

nextBtn?.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadPosts();
        window.scrollTo({ top: grid.offsetTop - 120, behavior: 'smooth' });
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
});
