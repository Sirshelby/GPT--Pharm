import { useEffect } from "react";

// Keeps the browser tab title and the search-result description in step
// with whichever page is showing. index.html holds the defaults for "/".
export function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title;

    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    }

    // Point the canonical URL at this page rather than the homepage.
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const url = new URL(canonical.href);
      url.pathname = window.location.pathname;
      canonical.href = url.toString();
    }
  }, [title, description]);
}
