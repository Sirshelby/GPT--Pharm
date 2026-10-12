import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

// React Router doesn't manage scroll for us, so on a new page we start at
// the top. If the URL has a #hash (e.g. #notify), we go to that section.
//
// We also move keyboard focus to the new page's content. Otherwise screen
// reader and keyboard users are left on the link they clicked, with no sign
// that anything changed.
export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (hash) {
      // Wait a frame so the target section has rendered after a page change.
      const frame = requestAnimationFrame(() => {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
      });
      return () => cancelAnimationFrame(frame);
    }

    window.scrollTo({ top: 0, behavior: "instant" });

    // On the very first load the browser already starts at the top of the page.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname, hash, key]);

  return null;
}
