import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

import { business } from "./src/content/site.js";

// Search engines and link previews (WhatsApp, X, Facebook) need absolute
// URLs, which means knowing the live domain. Set VITE_SITE_URL in .env or in
// your host's settings, e.g. https://gptpharm.ng. Without it the site still
// builds; it just skips the canonical link and the sitemap.
function seo(siteUrl) {
  const url = siteUrl?.replace(/\/+$/, "");
  const pages = ["/", "/services", "/about", "/visit", "/faq", "/privacy", "/terms"];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: business.name,
    description:
      "Community pharmacy in Abuja offering prescriptions, pharmacist advice, health checks and delivery.",
    areaServed: { "@type": "City", name: business.city },
    address: {
      "@type": "PostalAddress",
      ...(business.address && { streetAddress: business.address }),
      addressLocality: business.city,
      addressRegion: "FCT",
      addressCountry: "NG",
    },
    ...(business.phone && { telephone: business.phone }),
    ...(business.email && { email: business.email }),
    ...(url && { url, logo: `${url}/icon-512.png`, image: `${url}/og-image.png` }),
    sameAs: Object.values(business.social).filter(Boolean),
  };

  return {
    name: "gpt-pharm-seo",

    transformIndexHtml() {
      const tags = [
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: JSON.stringify(structuredData),
          injectTo: "head",
        },
      ];

      if (url) {
        tags.push(
          { tag: "link", attrs: { rel: "canonical", href: `${url}/` }, injectTo: "head" },
          { tag: "meta", attrs: { property: "og:url", content: `${url}/` }, injectTo: "head" },
          { tag: "meta", attrs: { property: "og:image", content: `${url}/og-image.png` }, injectTo: "head" },
          { tag: "meta", attrs: { name: "twitter:image", content: `${url}/og-image.png` }, injectTo: "head" }
        );
      }

      return tags;
    },

    generateBundle() {
      const robots = ["User-agent: *", "Allow: /", ...(url ? ["", `Sitemap: ${url}/sitemap.xml`] : [])];
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots.join("\n") + "\n" });

      if (!url) {
        this.warn("VITE_SITE_URL isn't set, so there's no canonical link or sitemap in this build.");
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const entries = pages
        .map((path) => `  <url><loc>${url}${path}</loc><lastmod>${today}</lastmod></url>`)
        .join("\n");

      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react(), seo(env.VITE_SITE_URL)],
    build: {
      // Vite normally inlines tiny files as data: URLs. Our security headers
      // only allow fonts from our own domain, so keep fonts as real files.
      assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
      rollupOptions: {
        output: {
          // React changes far less often than our own code, so keep it in its
          // own file that browsers can hold on to between deploys.
          manualChunks(id) {
            if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return "react";
          },
        },
      },
    },
  };
});
