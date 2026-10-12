import Icon from "./Icon.jsx";
import { prescriptionSteps } from "../content/site.js";
import { whatsappHref } from "../lib/business.js";
import "./Prescriptions.css";

export default function Prescriptions() {
  const whatsapp = whatsappHref("Hello, I'd like to send a prescription.");

  return (
    <section id="prescriptions" className="section section--mist" aria-labelledby="prescriptions-title">
      <div className="container">
        <div className="section-heading">
          <h2 id="prescriptions-title">Getting a prescription filled</h2>
          <p>
            No queueing with a slip of paper and hoping we have it. Tell us what you need and
            we'll have it ready.
          </p>
        </div>

        <ol className="steps">
          {prescriptionSteps.map((step, index) => (
            <li key={step.title} className="step">
              <span className="step__number" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>

        {whatsapp && (
          <a href={whatsapp} className="btn btn--primary steps__cta" target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={20} />
            Send a prescription on WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}
