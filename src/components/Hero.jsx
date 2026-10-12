import { Link } from "react-router";

import Icon from "./Icon.jsx";
import PrescriptionBottle from "./PrescriptionBottle.jsx";
import { isOpen, openingStatus } from "../lib/business.js";
import { notifyLink } from "../lib/links.js";
import "./Hero.css";

const highlights = [
  { icon: "check", text: "NAFDAC-registered medicines only" },
  { icon: "truck", text: "Delivery across Abuja" },
  { icon: "clock", text: "Open seven days a week" },
];

export default function Hero() {
  const open = isOpen();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__grid container">
        <div className="hero__copy">
          <p className="hero__status">
            <span className="hero__status-dot" aria-hidden="true" />
            {openingStatus()}
          </p>

          <h1 id="hero-title" className="hero__title">
            Genuine medicines and a pharmacist who listens.
          </h1>

          <p className="hero__lede">
            GPT Pharm &amp; Meds is a new community pharmacy in Abuja. We fill prescriptions, run
            quick health checks and deliver across the city, with a registered pharmacist on duty
            every hour we're open.
          </p>

          <div className="hero__actions">
            {open ? (
              <Link to="/visit" className="btn btn--primary">
                Plan your visit
              </Link>
            ) : (
              <Link to={notifyLink} className="btn btn--primary">
                Get notified when we open
              </Link>
            )}
            <Link to="/services" className="btn btn--quiet">
              See our services
            </Link>
          </div>

          <ul className="hero__highlights">
            {highlights.map(({ icon, text }) => (
              <li key={text}>
                <Icon name={icon} size={20} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__art">
          <PrescriptionBottle />
        </div>
      </div>
    </section>
  );
}
