/**
 * BlogService - Data Access Layer for Loom Saga Blog / Fashion Insights
 * @description Fetches blog posts from WordPress via Vercel serverless proxy.
 * @version 1.1.0
 */
class BlogService {
    constructor() {
        this.posts = [];
        this.isLoaded = false;
        this.loadPromise = null;

        // ── Session cache config ──
        this._POSTS_CACHE_PREFIX = 'ls_posts_cache_';
        this._POST_CACHE_PREFIX = 'ls_post_cache_';
        this._POSTS_TTL = 5 * 60 * 1000;   // 5 minutes for listing
        this._POST_TTL = 10 * 60 * 1000;    // 10 minutes for single articles
    }

    /**
     * Fetch all published blog posts for the listing page.
     * @param {Object} options - Query options
     * @param {number} [options.perPage=20] - Number of posts per page
     * @param {number} [options.page=1] - Page number
     * @param {string} [options.category] - Optional category slug filter
     * @returns {Promise<{posts: Array, totalPosts: number, totalPages: number}>}
     */
    async getPosts(options = {}) {
        const { perPage = 20, page = 1, category = "" } = options;

        // ── 1. Try sessionStorage cache first ──
        const cacheKey = `${this._POSTS_CACHE_PREFIX}p${page}_n${perPage}_c${category}`;
        const cached = this._readCache(cacheKey, this._POSTS_TTL);
        if (cached) {
            console.log('[BlogService] Loaded posts from session cache (instant)');
            this.posts = cached.posts || [];
            this.isLoaded = true;
            return cached;
        }

        // ── 2. Fetch from API ──
        try {
            let url = `/api/posts?per_page=${perPage}&page=${page}`;
            if (category) {
                url += `&category=${encodeURIComponent(category)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            this.posts = data.posts || [];
            this.isLoaded = true;

            const result = {
                posts: data.posts || [],
                totalPosts: data.totalPosts || 0,
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || 1,
            };

            this._writeCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error("[BlogService] Failed to fetch posts:", error);
            return { posts: [], totalPosts: 0, totalPages: 0, currentPage: 1 };
        }
    }

    /**
     * Fetch a single blog post by its slug.
     * @param {string} slug - The post slug from the URL
     * @returns {Promise<{post: Object|null, relatedPosts: Array}>}
     */
    async getPost(slug) {
        if (!slug) {
            console.error("[BlogService] No slug provided");
            return { post: null, relatedPosts: [] };
        }

        // ── 1. Try sessionStorage cache first ──
        const cacheKey = `${this._POST_CACHE_PREFIX}${slug}`;
        const cached = this._readCache(cacheKey, this._POST_TTL);
        if (cached) {
            console.log(`[BlogService] Loaded article "${slug}" from session cache (instant)`);
            return cached;
        }

        // ── 2. Fetch from API ──
        try {
            const response = await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return { post: null, relatedPosts: [] };
                }
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            const result = {
                post: data.post || null,
                relatedPosts: data.relatedPosts || [],
            };

            this._writeCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error("[BlogService] Failed to fetch post:", error);
            return { post: null, relatedPosts: [] };
        }
    }

    // ==================== SESSION CACHE ====================

    /**
     * Read cached data from sessionStorage.
     * @private
     */
    _readCache(key, ttl) {
        try {
            // Skip cache if ?nocache is in the URL (for development/testing)
            if (new URLSearchParams(window.location.search).has('nocache')) return null;

            const raw = sessionStorage.getItem(key);
            if (!raw) return null;

            const { ts, data } = JSON.parse(raw);
            if (Date.now() - ts > ttl) {
                sessionStorage.removeItem(key);
                return null;
            }

            return data;
        } catch {
            return null;
        }
    }

    /**
     * Write data to sessionStorage with a timestamp.
     * @private
     */
    _writeCache(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify({
                ts: Date.now(),
                data: data
            }));
        } catch (e) {
            console.warn('[BlogService] sessionStorage write failed', e.message);
        }
    }

    /**
     * Strip HTML tags from a string (for cleaning excerpts).
     * @param {string} html - HTML string
     * @returns {string} - Plain text
     */
    static stripHtml(html) {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    /**
     * Truncate text to a given length with ellipsis.
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum characters
     * @returns {string}
     */
    static truncate(text, maxLength = 120) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + "...";
    }
}

// Export a singleton instance
const blogService = new BlogService();
export default blogService;
export { BlogService };
