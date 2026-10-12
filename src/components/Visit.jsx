import { Link } from "react-router";

import Icon from "./Icon.jsx";
import { business, deliveryAreas, openingHours } from "../content/site.js";
import { friendlyTime, isOpen, mapLinks, phoneHref, whatsappHref } from "../lib/business.js";
import { notifyLink } from "../lib/links.js";
import "./Visit.css";

export default function Visit() {
  const map = mapLinks();
  const open = isOpen();

  const contacts = [
    business.phone && { icon: "phone", label: "Call", value: business.phone, href: phoneHref() },
    business.whatsapp && { icon: "whatsapp", label: "WhatsApp", value: "Chat with a pharmacist", href: whatsappHref(), external: true },
    business.email && { icon: "mail", label: "Email", value: business.email, href: `mailto:${business.email}` },
  ].filter(Boolean);

  return (
    <section className="section" aria-label="Address, hours and contact details">
      <div className="visit container">
        <div className="visit__details">
          <div className="visit__block">
            <h2 className="visit__label">
              <Icon name="pin" size={20} />
              Address
            </h2>
            {business.address ? (
              <>
                <address className="visit__address">
                  {business.name}
                  <br />
                  {business.address}
                </address>
                <a href={map.directions} className="btn btn--quiet visit__directions" target="_blank" rel="noopener noreferrer">
                  Get directions
                  <Icon name="external" size={18} />
                </a>
              </>
            ) : (
              <p className="visit__pending">
                We're in central {business.city} and will publish the full address before opening
                day. <Link to={notifyLink} className="text-link">Join the list</Link> and
                you'll hear first.
              </p>
            )}
          </div>

          <div className="visit__block">
            <h2 className="visit__label">
              <Icon name="clock" size={20} />
              Opening hours
            </h2>
            <table className="hours">
              <caption className="visually-hidden">Opening hours</caption>
              <tbody>
                {openingHours.map((row) => (
                  <tr key={row.days}>
                    <th scope="row">{row.days}</th>
                    <td>
                      {friendlyTime(row.opens)} to {friendlyTime(row.closes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!open && <p className="visit__note">These are our hours from opening day.</p>}
          </div>

          {contacts.length > 0 && (
            <div className="visit__block">
              <h2 className="visit__label">
                <Icon name="chat" size={20} />
                Get in touch
              </h2>
              <ul className="contacts">
                {contacts.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="contact"
                      {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      <Icon name={item.icon} size={20} />
                      <span>
                        <span className="contact__label">{item.label}</span>
                        <span className="contact__value">{item.value}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="visit__side">
          {map && (
            <div className="visit__map">
              <iframe
                title={`Map showing ${business.name}`}
                src={map.embed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          <div className="delivery">
            <Icon name="truck" size={32} className="delivery__icon" />
            <h2 className="delivery__title">Can't get to us? We'll come to you.</h2>
            <p>
              We deliver medicines and health products to homes and offices across {business.city}.
              The fee depends on distance, and we'll confirm it before anything goes out.
            </p>
            <ul className="delivery__areas" aria-label="Areas we deliver to">
              {deliveryAreas.map((area) => (
                <li key={area}>{area}</li>
              ))}
              <li className="delivery__more">and nearby</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
