import { Link } from "react-router";

import Icon from "./Icon.jsx";
import { Logo } from "./Logo.jsx";
import { business, navLinks, openingHours } from "../content/site.js";
import { friendlyTime, phoneHref, whatsappHref } from "../lib/business.js";
import "./Footer.css";

const socialLabels = { instagram: "Instagram", facebook: "Facebook", x: "X (Twitter)" };

export default function Footer() {
  const year = new Date().getFullYear();
  const socials = Object.entries(business.social).filter(([, url]) => url);

  return (
    <footer className="site-footer">
      <div className="site-footer__grid container">
        <div className="site-footer__about">
          <Logo tone="light" />
          <p>
            A community pharmacy for {business.city}: genuine medicines, honest advice and a
            registered pharmacist on duty whenever we're open.
          </p>

          {socials.length > 0 && (
            <ul className="site-footer__social">
              {socials.map(([network, url]) => (
                <li key={network}>
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={socialLabels[network]}>
                    <Icon name={network} size={20} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="site-footer__heading">Pages</h2>
          <ul className="site-footer__list">
            <li>
              <Link to="/">Home</Link>
            </li>
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="site-footer__heading">Opening hours</h2>
          <ul className="site-footer__list">
            {openingHours.map((row) => (
              <li key={row.days}>
                {row.days}
                <br />
                <span className="site-footer__time">
                  {friendlyTime(row.opens)} to {friendlyTime(row.closes)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="site-footer__heading">Contact</h2>
          <ul className="site-footer__list">
            {business.address && <li>{business.address}</li>}
            {business.phone && (
              <li>
                <a href={phoneHref()}>{business.phone}</a>
              </li>
            )}
            {business.whatsapp && (
              <li>
                <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
            )}
            {business.email && (
              <li>
                <a href={`mailto:${business.email}`}>{business.email}</a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="site-footer__base container">
        <p className="site-footer__disclaimer">
          Information on this website is general and isn't a substitute for advice from a pharmacist
          or doctor who knows your situation. In an emergency, go to the nearest hospital.
        </p>

        <div className="site-footer__legal">
          <div>
            <p>
              &copy; {year} {business.name}
            </p>
            {business.pcnPremisesNumber && (
              <p>Pharmacy Council of Nigeria premises registration: {business.pcnPremisesNumber}</p>
            )}
          </div>
          <ul>
            <li>
              <Link to="/privacy">Privacy policy</Link>
            </li>
            <li>
              <Link to="/terms">Terms of use</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
