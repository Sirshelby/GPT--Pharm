# GPT Pharm & Meds website

The website for GPT Pharm & Meds, our community pharmacy in Abuja.

It's a small React app built with Vite. Styling is plain CSS (one file per component, no UI kit), fonts are self-hosted, and the "Notify me" form saves sign-ups to Supabase.

## Running it locally

You'll need Node 20.19 or newer.

```bash
cp .env.example .env   # then fill in the values
npm install
npm run dev
```

Then open http://localhost:5173.

## Pages

| Address | Page | File |
| --- | --- | --- |
| `/` | Home: a short tour with links to everything else | `src/pages/HomePage.jsx` |
| `/services` | Services and how prescriptions work | `src/pages/ServicesPage.jsx` |
| `/about` | Why we're opening and the standards we keep | `src/pages/AboutPage.jsx` |
| `/visit` | Address, map, hours, delivery and contact details | `src/pages/VisitPage.jsx` |
| `/faq` | Questions and answers | `src/pages/FaqPage.jsx` |
| `/privacy`, `/terms` | Legal pages | `src/pages/PrivacyPage.jsx`, `TermsPage.jsx` |

Every page shares the same menu, "get notified" sign-up band and footer, which live in `src/components/Layout.jsx`.

**Adding a page:** create it in `src/pages`, add a `<Route>` for it in `src/App.jsx`, add it to `navLinks` in `src/content/site.js` if it belongs in the menu, and add its address to `pages` in `vite.config.js` so it's in the sitemap.

The About page's "Why we're opening" section is written in general terms. If you'd like to tell your own story there, that's the place for it.

## Changing details on the site

Almost everything you'll want to change is in **`src/content/site.js`**: address, phone, WhatsApp, email, opening date, opening hours, delivery areas, services, FAQs and so on.

Anything left as `null` is simply hidden, so the site never shows a half-finished detail. A few things switch on automatically once you fill them in:

| Set this in `site.js` | What appears on the site |
| --- | --- |
| `address` | The map and "Get directions" button on the Visit us page, and the address in the footer |
| `openingDate` | The date in the hero, FAQ and sign-up section. From that day on, the site says "Now open", the sign-up band is hidden and the main button becomes "Plan your visit" |
| `phone` | A "Call" button in Visit us, and the number in the footer |
| `whatsapp` | A floating WhatsApp button, plus "Send a prescription on WhatsApp" |
| `pcnPremisesNumber` | Your PCN premises registration in the footer |
| `social` | Social icons in the footer |

## Launch checklist

Before pointing the domain at the site:

- [ ] Fill in the real `phone`, `whatsapp` and `address` in `src/content/site.js` (or leave them as `null`, never placeholders).
- [ ] Check that `hello@gptpharm.ng` actually receives mail, or change `email`.
- [ ] Set `openingDate` once it's confirmed.
- [ ] Add `pcnPremisesNumber` once the premises licence is issued.
- [ ] Have a lawyer read the [privacy policy](src/pages/PrivacyPage.jsx) and [terms](src/pages/TermsPage.jsx). They're written for the Nigeria Data Protection Act 2023 but haven't been legally reviewed. Update the `UPDATED` date at the top of each file whenever the wording changes.
- [ ] Confirm the claims on the page are true on day one: NAFDAC-registered suppliers only, a pharmacist on duty during all opening hours, delivery to the listed areas, and the health checks listed under services.
- [ ] Set the environment variables on your host (see below), including `VITE_SITE_URL`.
- [ ] After launch, add the site to [Google Search Console](https://search.google.com/search-console) and submit `/sitemap.xml`, and set up a Google Business Profile so you show up on Maps.

## Environment variables

| Name | What it's for |
| --- | --- |
| `VITE_SITE_URL` | The live address, e.g. `https://gptpharm.ng`. Used for the canonical link, link previews on WhatsApp and social media, and the sitemap. Without it the site works, but those are left out. |
| `VITE_SUPABASE_URL` | Supabase project URL for the sign-up form. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key. Safe in the browser: the `signups` table only accepts new rows, so nobody can read the list through the website. |

Put them in `.env` for local work, and in your host's environment settings for the live site. `.env` is in `.gitignore`. If it was committed before, untrack it with `git rm --cached .env`.

## Sign-ups

The form writes to the `signups` table in Supabase. To see who's signed up, open that table in the Supabase dashboard.

- Signing up twice with the same email just shows the thank-you message again.
- A hidden "honeypot" field catches most spam bots without a captcha.
- The Supabase library only downloads when someone starts filling in the form, which keeps the first page load light.

## Deploying

```bash
npm run build
```

This creates a `dist/` folder you can put on any static host. Both common hosts are already set up:

- **Vercel:** `vercel.json` handles page routing, security headers and caching.
- **Netlify:** `public/_redirects` and `public/_headers` do the same job.

If you change the security headers, change them in both places. If you add anything that loads from another domain (analytics, a chat widget, embedded video), add that domain to the `Content-Security-Policy` header or the browser will block it.

## Where things are

```
src/
  content/site.js       business details, copy, services, FAQs
  components/           shared layout and page sections, each with its own CSS
  pages/                one file per page (home, services, about, visit, faq, legal, 404)
  lib/                  formatting helpers, links, Supabase sign-up logic
  hooks/                page title and description
  styles/global.css     colours, type scale, buttons, shared layout
public/                 icons, social preview image, host config
vite.config.js          build settings, sitemap, robots.txt, structured data
```

## Design notes

- **Colours:** the brand teal `#229991` is used for large shapes. Text and buttons use the deeper `#136b66` so they meet contrast guidelines on white.
- **Type:** Young Serif for headings, Hanken Grotesk for everything else, and IBM Plex Mono only on the prescription label in the hero.
- **Motion:** one entrance animation on the hero bottle. It's switched off for anyone who has reduced motion turned on.
