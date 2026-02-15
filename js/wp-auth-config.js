/**
 * WordPress auth host for browser-based login/reset flow.
 * Optional fallback:
 * window.LOOM_WP_BASE_URL = "https://your-store-domain.com";
 *
 * Preferred source is /api/public-config, which reads process.env.WP_BASE_URL.
 */
window.LOOM_WP_BASE_URL = window.LOOM_WP_BASE_URL || "";

window.getLoomWpBaseUrl = window.getLoomWpBaseUrl || (function () {
  let cachedUrl = "";
  let hasFetched = false;

  function normalizeBaseUrl(url) {
    return String(url || "").trim().replace(/\/+$/, "");
  }

  return async function getLoomWpBaseUrl() {
    if (cachedUrl) return cachedUrl;

    const directUrl = normalizeBaseUrl(window.LOOM_WP_BASE_URL);
    if (directUrl) {
      cachedUrl = directUrl;
      return cachedUrl;
    }

    if (!hasFetched) {
      hasFetched = true;
      try {
        const response = await fetch("/api/public-config", {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const payload = await response.json().catch(() => ({}));
          const fromApi = normalizeBaseUrl(payload && payload.wpBaseUrl);
          if (fromApi) {
            cachedUrl = fromApi;
            window.LOOM_WP_BASE_URL = fromApi;
            return cachedUrl;
          }
        }
      } catch (error) {
        console.warn("Unable to fetch public auth config:", error);
      }
    }

    return "";
  };
})();
