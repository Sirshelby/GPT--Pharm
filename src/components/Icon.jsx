// A small hand-picked icon set, drawn on a 24px grid with a 1.75 stroke.
// Inline SVG keeps them crisp, lets them inherit colour, and saves us
// pulling in a whole icon library for a dozen shapes.

const paths = {
  prescription: (
    <>
      <path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M9.5 8h2.25a1.75 1.75 0 0 1 0 3.5H9.5V8Zm0 3.5V15m2.25-3.5L15 15m-1.5-1.75L15 11.5" />
    </>
  ),
  chat: (
    <>
      <path d="M20 12a8 8 0 0 1-11.6 7.14L4 20l.9-4.2A8 8 0 1 1 20 12Z" />
      <path d="M9 12h.01M12 12h.01M15 12h.01" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
      <path d="M7.5 12h2.25l1.25-2 2 4 1.25-2h2.25" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4m8-4v4M4 10h16m-8 3v4m-2-2h4" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.5 11h.01M14.5 11h.01M10 15a3 3 0 0 0 4 0M12 4c-1.5 1-1.5 2.5 0 3" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14H5Z" />
      <path d="M5 19c3-4 6-7 10-9" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.25" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9.5h3.5L21 13v3h-7" />
      <circle cx="7" cy="17.5" r="1.75" />
      <circle cx="17" cy="17.5" r="1.75" />
    </>
  ),
  phone: (
    <path d="M6.6 3.5h2.6l1.3 4.1-1.9 1.3a11 11 0 0 0 6.5 6.5l1.3-1.9 4.1 1.3v2.6a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1Z" />
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  external: <path d="M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
};

// Brand marks are filled rather than stroked, so they're kept apart.
const brandPaths = {
  whatsapp:
    "M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Zm5.5 13.4c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4-.1.7.5l.9 2.2c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2.1 1c.3.1.5.2.6.3.1.1.1.6-.1 1.3Z",
  instagram:
    "M12 3.5c-2.3 0-2.6 0-3.5.1-2.6.1-4 1.5-4.2 4.2-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c.1 2.6 1.5 4.1 4.2 4.2.9.1 1.2.1 3.5.1s2.6 0 3.5-.1c2.6-.1 4.1-1.5 4.2-4.2.1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c-.1-2.6-1.5-4.1-4.2-4.2-.9-.1-1.2-.1-3.5-.1Zm0 1.5c2.3 0 2.5 0 3.4.1 1.8.1 2.7 1 2.8 2.8.1.9.1 1.1.1 3.4s0 2.5-.1 3.4c-.1 1.8-1 2.7-2.8 2.8-.9.1-1.1.1-3.4.1s-2.5 0-3.4-.1c-1.8-.1-2.7-1-2.8-2.8-.1-.9-.1-1.1-.1-3.4s0-2.5.1-3.4c.1-1.8 1-2.7 2.8-2.8.9-.1 1.1-.1 3.4-.1Zm0 2.6a4.3 4.3 0 1 0 0 8.7 4.3 4.3 0 0 0 0-8.7Zm0 7.2a2.8 2.8 0 1 1 0-5.7 2.8 2.8 0 0 1 0 5.7Zm4.5-8.4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  facebook:
    "M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.4 1.5-1.4h1.5V4.5a20 20 0 0 0-2.2-.1c-2.2 0-3.8 1.4-3.8 3.9v2.2H8v3h2.5V21h3Z",
  x: "M17.6 3.5h2.9l-6.3 7.2 7.4 9.8h-5.8l-4.5-5.9-5.2 5.9H3.2l6.7-7.7-7.1-9.3h5.9l4.1 5.4 4.8-5.4Zm-1 15.3h1.6L7.4 5.1H5.7l10.9 13.7Z",
};

export default function Icon({ name, size = 24, className, label }) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  if (brandPaths[name]) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} {...a11y}>
        <path d={brandPaths[name]} />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...a11y}
    >
      {paths[name]}
    </svg>
  );
}
