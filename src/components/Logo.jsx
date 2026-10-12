import "./Logo.css";

// The pharmacy mark: a rounded teal tile with a green-cross cut-out.
// Same drawing as public/favicon.svg, so the tab icon and the logo match.
export function LogoMark({ size = 36 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#229991" />
      <path
        d="M17 9.5h6a1 1 0 0 1 1 1V16h5.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H24v5.5a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V24h-5.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1H16v-5.5a1 1 0 0 1 1-1Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function Logo({ tone = "dark" }) {
  return (
    <span className={`logo logo--${tone}`}>
      <LogoMark />
      <span className="logo__words">
        <span className="logo__name">GPT Pharm &amp; Meds</span>
        <span className="logo__place">Pharmacy in Abuja</span>
      </span>
    </span>
  );
}
