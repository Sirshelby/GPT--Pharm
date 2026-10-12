import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router";

import Icon from "./Icon.jsx";
import { Logo } from "./Logo.jsx";

const FOCUSABLE = "a[href], button:not([disabled])";

export default function MobileMenu({ open, onClose, links, action }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.querySelector(FOCUSABLE)?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Keep Tab cycling inside the drawer while it's open
      if (event.key !== "Tab" || !panel) return;
      const items = panel.querySelectorAll(FOCUSABLE);
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Following a link should close the drawer without yanking focus back up to the toggle
  const closeAfterNavigating = () => onClose({ restoreFocus: false });

  return createPortal(
    <div className={`drawer${open ? " is-open" : ""}`} inert={!open}>
      <div className="drawer__backdrop" onClick={() => onClose()} />

      <div
        id="mobile-menu"
        ref={panelRef}
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="drawer__header">
          <Logo />
          <button type="button" className="drawer__close" aria-label="Close menu" onClick={() => onClose()}>
            <Icon name="close" size={22} />
          </button>
        </div>

        <ul className="drawer__links">
          <li>
            <NavLink to="/" end className="drawer__link" onClick={closeAfterNavigating}>
              Home
            </NavLink>
          </li>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className="drawer__link" onClick={closeAfterNavigating}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <Link to={action.to} className="btn btn--primary drawer__cta" onClick={closeAfterNavigating}>
          {action.label}
        </Link>
      </div>
    </div>,
    document.body
  );
}
