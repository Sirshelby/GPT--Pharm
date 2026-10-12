import { Link } from "react-router";

import Icon from "./Icon.jsx";
import { business, openingHours } from "../content/site.js";
import { friendlyTime, isOpen } from "../lib/business.js";
import "./VisitSummary.css";

// The short version of the Visit us page, for the bottom of the home page:
// where we are, when we're open, and a way through to the full details.
export default function VisitSummary() {
  return (
    <section className="section visit-summary" aria-labelledby="visit-summary-title">
      <div className="visit-summary__layout container">
        <div>
          <h2 id="visit-summary-title" className="visit-summary__title">
            Find us in {business.city}
          </h2>
          <p className="visit-summary__where">
            <Icon name="pin" size={22} />
            {business.address ?? `Central ${business.city}. Full address announced before opening day.`}
          </p>
          <p className="visit-summary__where">
            <Icon name="truck" size={22} />
            Can't get to us? We deliver across {business.city}.
          </p>
          <Link to="/visit" className="btn btn--primary section-more">
            {business.address ? "Get directions and contact details" : "Hours, delivery and contact details"}
          </Link>
        </div>

        <div className="visit-summary__hours">
          <h3>{isOpen() ? "Opening hours" : "Opening hours from day one"}</h3>
          <dl>
            {openingHours.map((row) => (
              <div key={row.days}>
                <dt>{row.days}</dt>
                <dd>
                  {friendlyTime(row.opens)} to {friendlyTime(row.closes)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
