import { Link } from "react-router";

import { navLinks } from "../content/site.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  usePageTitle("Page not found | GPT Pharm & Meds");

  return (
    <div className="not-found container">
      <NoIndex />
      <p className="not-found__code">404</p>
      <h1>We couldn't find that page.</h1>
      <p className="not-found__text">
        The link may be old, or the address may have a typo. One of these might be what you were
        after:
      </p>
      <ul className="not-found__links">
        <li>
          <Link to="/" className="btn btn--primary">
            Home
          </Link>
        </li>
        {navLinks.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="btn btn--quiet">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The host answers every unknown URL with the app (that's how a single-page
// site works), so tell search engines not to index whatever odd address
// brought someone here. React 19 moves this <meta> into <head> for us and
// removes it again when the page unmounts.
function NoIndex() {
  return <meta name="robots" content="noindex" />;
}
