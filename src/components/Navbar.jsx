import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router";

import Icon from "./Icon.jsx";
import { Logo } from "./Logo.jsx";
import MobileMenu from "./MobileMenu.jsx";
import { navLinks } from "../content/site.js";
import { isOpen } from "../lib/business.js";
import { notifyLink } from "../lib/links.js";
import "./Navbar.css";

// Before opening day the main button gets people onto the list.
// Afterwards there's no list to join, so it helps them find us instead.
export function primaryAction() {
  return isOpen() ? { label: "Plan your visit", to: "/visit" } : { label: "Get notified", to: notifyLink };
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef(null);
  const action = primaryAction();

  const closeMenu = useCallback(({ restoreFocus = true } = {}) => {
    setMenuOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  // A hairline under the bar once the page moves, so it doesn't float on the content.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`site-nav${scrolled ? " is-scrolled" : ""}`}>
        <nav className="site-nav__inner container" aria-label="Main">
          <Link to="/" className="site-nav__brand" aria-label="GPT Pharm & Meds, home">
            <Logo />
          </Link>

          <ul className="site-nav__links">
            {navLinks.map((link) => (
              <li key={link.to}>
                {/* NavLink adds aria-current="page" for us, which the CSS uses for the underline */}
                <NavLink to={link.to} className="site-nav__link">
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="site-nav__actions">
            <Link to={action.to} className="btn btn--primary site-nav__cta">
              {action.label}
            </Link>

            <button
              ref={toggleRef}
              type="button"
              className="site-nav__toggle"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Lives outside the header on purpose: the header's backdrop blur would
          trap a fixed-position drawer inside it. */}
      <MobileMenu open={menuOpen} onClose={closeMenu} links={navLinks} action={action} />
    </>
  );
}
