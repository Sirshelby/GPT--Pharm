import { Link } from "react-router";

import Icon from "./Icon.jsx";
import { business, faqs } from "../content/site.js";
import { formattedOpeningDate, isOpen } from "../lib/business.js";
import { notifyLink } from "../lib/links.js";
import "./Faq.css";

// A couple of answers depend on details that change before launch,
// so they're worked out here instead of being hard-coded in site.js.
function dynamicAnswer(id) {
  if (id === "opening") {
    if (isOpen()) return "We're open now. Come and say hello.";
    const date = formattedOpeningDate();
    return date ? (
      <>
        We open on {date}. <Link to={notifyLink} className="text-link">Join the list</Link> and
        we'll send you a reminder with everything you need to know.
      </>
    ) : (
      <>
        We're putting the finishing touches in place and will announce the date once it's confirmed.
        People on <Link to={notifyLink} className="text-link">our list</Link> hear first.
      </>
    );
  }

  if (id === "where") {
    return business.address ? (
      <>
        You'll find us at {business.address}. There's a map and directions on our{" "}
        <Link to="/visit" className="text-link">Visit us</Link> page.
      </>
    ) : (
      `We're in central ${business.city}. We'll publish the full address before opening day, and anyone on our list will get it by email.`
    );
  }

  return null;
}

export default function Faq() {
  return (
    <section className="section" aria-label="Frequently asked questions">
      <div className="container">
        <div className="faq__list">
          {faqs.map((faq) => (
            <details key={faq.id} className="faq__item" name="faq">
              <summary>
                {faq.question}
                <Icon name="plus" size={22} className="faq__icon" />
              </summary>
              <div className="faq__answer">
                <p>{faq.answer ?? dynamicAnswer(faq.id)}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
