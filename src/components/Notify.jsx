import SignupForm from "./SignupForm.jsx";
import { formattedOpeningDate } from "../lib/business.js";
import "./Notify.css";

export default function Notify() {
  const date = formattedOpeningDate();

  return (
    <section id="notify" className="section notify" aria-labelledby="notify-title">
      <div className="notify__layout container">
        <div className="notify__copy">
          <h2 id="notify-title">Be the first to know when we open</h2>
          <p>
            {date
              ? `We open on ${date}. Leave your details and we'll send a reminder with our address, hours and anything else you need for your first visit.`
              : "Leave your details and we'll email you when we have an opening date, along with our address and hours. One or two emails, nothing more."}
          </p>
        </div>

        <SignupForm />
      </div>
    </section>
  );
}
