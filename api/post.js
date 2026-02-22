/**
 * Vercel Serverless Function — Single Blog Post
 * Proxies WordPress REST API: GET /wp-json/wp/v2/posts?slug={slug}
 * Returns full post content for the article template page.
 */
export default async function handler(req, res) {
    const WP_BASE_URL = process.env.WP_BASE_URL || process.env.WC_API_URL;

    if (!WP_BASE_URL) {
        return res.status(500).json({ error: "Server configuration error: WP_BASE_URL not set" });
    }

    const slug = req.query.slug;

    if (!slug) {
        return res.status(400).json({ error: "Missing required parameter: slug" });
    }

    try {
        const apiUrl = `${WP_BASE_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed&status=publish`;

        const response = await fetch(apiUrl, { method: "GET" });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("WP Post API Error:", response.status, errorText);
            return res.status(500).json({ error: "Failed to fetch post from WordPress" });
        }

        const wpPosts = await response.json();

        if (!wpPosts || wpPosts.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        const post = wpPosts[0];

        // Extract featured image
        const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
        const featuredImage = featuredMedia?.source_url || "";
        const featuredImageAlt = featuredMedia?.alt_text || post.title?.rendered || "";

        // Extract categories
        const categories = post._embedded?.["wp:term"]?.[0] || [];
        const primaryCategory = categories[0]?.name || "Uncategorized";
        const primaryCategorySlug = categories[0]?.slug || "uncategorized";

        // Format date
        const dateObj = new Date(post.date);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        // Also fetch a few related posts (same category, excluding current)
        let relatedPosts = [];
        try {
            if (categories[0]?.id) {
                const relatedUrl = `${WP_BASE_URL}/wp-json/wp/v2/posts?_embed&categories=${categories[0].id}&exclude=${post.id}&per_page=3&status=publish`;
                const relatedRes = await fetch(relatedUrl, { method: "GET" });
                if (relatedRes.ok) {
                    const relatedWpPosts = await relatedRes.json();
                    relatedPosts = relatedWpPosts.map((rp) => ({
                        id: rp.id,
                        slug: rp.slug,
                        title: rp.title?.rendered || "",
                        featuredImage: rp._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "",
                        categoryName: rp._embedded?.["wp:term"]?.[0]?.[0]?.name || "Uncategorized",
                        link: `/article?slug=${rp.slug}`,
                    }));
                }
            }
        } catch (relatedErr) {
            console.warn("Could not fetch related posts:", relatedErr.message);
        }

        // Cache at Vercel's edge CDN — 10 min fresh, 20 min stale-while-revalidate
        // (articles change less frequently than listings)
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

        return res.status(200).json({
            post: {
                id: post.id,
                slug: post.slug,
                title: post.title?.rendered || "",
                content: post.content?.rendered || "",
                excerpt: post.excerpt?.rendered || "",
                date: post.date,
                formattedDate,
                categoryName: primaryCategory,
                categorySlug: primaryCategorySlug,
                featuredImage,
                featuredImageAlt,
            },
            relatedPosts,
        });
    } catch (error) {
        console.error("Post API Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
