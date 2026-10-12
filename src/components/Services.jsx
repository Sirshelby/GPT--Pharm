import { Link } from "react-router";

import Icon from "./Icon.jsx";
import { services } from "../content/site.js";
import "./Services.css";

// On the home page this shows a taster (`preview`): a heading, the first few
// services and a link to the rest. On the Services page it's the full list,
// sitting under the page's own title.
export default function Services({ preview = false }) {
  const shown = preview ? services.slice(0, 4) : services;
  // Under the home page's "What we can help with" these are sub-headings;
  // on the Services page they sit straight under the page title.
  const Title = preview ? "h3" : "h2";

  return (
    <section
      className={`section services${preview ? " services--preview" : ""}`}
      aria-labelledby={preview ? "services-title" : undefined}
      aria-label={preview ? undefined : "Our services"}
    >
      <div className="services__layout container">
        {preview && (
          <div className="section-heading services__heading">
            <h2 id="services-title">What we can help with</h2>
            <p>
              Everything you'd expect from a good neighbourhood pharmacy, done carefully and
              explained clearly.
            </p>
            <Link to="/services" className="btn btn--quiet section-more">
              See all our services
            </Link>
          </div>
        )}

        <ul className="services__list">
          {shown.map((service) => (
            <li key={service.title} className="service">
              <span className="service__icon">
                <Icon name={service.icon} size={26} />
              </span>
              <Title className="service__title">{service.title}</Title>
              <p>{service.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
