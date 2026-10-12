import { business } from "../content/site.js";
import { formattedOpeningDate, isOpen } from "../lib/business.js";
import "./PrescriptionBottle.css";

// The hero illustration: a dispensing bottle whose label reads like the ones
// we'll print at the counter, except it's our promise instead of a dosage.
// Purely decorative (everything on it is said elsewhere on the page), so
// screen readers skip it.
export default function PrescriptionBottle() {
  const date = formattedOpeningDate({ short: true });
  const footer = isOpen() ? "Now open" : date ? `Opens ${date}` : "Opening soon";

  const lines = [
    ["For", `Everyone in ${business.city}`],
    ["Directions", "Come in any time. No appointment needed."],
    ["Contains", "Genuine medicines only"],
    ["Checked by", "A registered pharmacist"],
  ];

  return (
    <div className="bottle-scene" aria-hidden="true">
      <span className="capsule capsule--one" />
      <span className="capsule capsule--two" />
      <span className="tablet" />

      <div className="bottle">
        <div className="bottle__cap" />
        <div className="bottle__neck" />
        <div className="bottle__body">
          <div className="rx-label">
            <div className="rx-label__head">
              <span className="rx-label__shop">
                GPT PHARM &amp; MEDS
                <small>{business.city}, FCT</small>
              </span>
              <span className="rx-label__rx">℞</span>
            </div>

            <dl className="rx-label__lines">
              {lines.map(([term, detail]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>

            <div className="rx-label__foot">
              <span>{footer}</span>
              <span>Keep out of reach of children</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
