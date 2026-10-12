import { useRef, useState } from "react";
import { Link } from "react-router";

import Icon from "./Icon.jsx";
import { checkSignup, saveSignup, warmUpSignup } from "../lib/signups.js";

export default function SignupForm() {
  const [values, setValues] = useState({ fullName: "", email: "", website: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | saving | done | failed
  const fields = { fullName: useRef(null), email: useRef(null) };

  function update(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // Clear a field's error as soon as they start fixing it
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "saving") return;

    // "website" is a hidden field people never see. Bots fill in every field,
    // so if it has a value we quietly pretend it worked and save nothing.
    if (values.website) {
      setStatus("done");
      return;
    }

    const { entry, errors: problems } = checkSignup(values);
    if (problems) {
      setErrors(problems);
      const firstBadField = Object.keys(problems)[0];
      fields[firstBadField]?.current?.focus();
      return;
    }

    setErrors({});
    setStatus("saving");

    try {
      await saveSignup(entry);
      setStatus("done");
    } catch (err) {
      console.error("Couldn't save sign-up:", err);
      setStatus("failed");
    }
  }

  if (status === "done") {
    return (
      <div className="signup signup--done" role="status">
        <span className="signup__tick">
          <Icon name="check" size={28} />
        </span>
        <p className="signup__done-title">You're on the list.</p>
        <p className="signup__done-text">
          We'll email you as soon as we have an opening date, and again before the doors open.
        </p>
      </div>
    );
  }

  return (
    <form className="signup" onSubmit={handleSubmit} onFocus={warmUpSignup} noValidate>
      <div className="signup__field">
        <label htmlFor="signup-name">Your name</label>
        <input
          ref={fields.fullName}
          id="signup-name"
          name="fullName"
          type="text"
          autoComplete="name"
          maxLength={100}
          value={values.fullName}
          onChange={update}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "signup-name-error" : undefined}
        />
        {errors.fullName && (
          <p id="signup-name-error" className="signup__error">
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="signup__field">
        <label htmlFor="signup-email">Email address</label>
        <input
          ref={fields.email}
          id="signup-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={255}
          value={values.email}
          onChange={update}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
        />
        {errors.email && (
          <p id="signup-email-error" className="signup__error">
            {errors.email}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and screen readers, irresistible to bots */}
      <div className="signup__trap" aria-hidden="true">
        <label htmlFor="signup-website">Leave this empty</label>
        <input
          id="signup-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={update}
        />
      </div>

      <button type="submit" className="btn btn--primary signup__button" disabled={status === "saving"}>
        {status === "saving" ? "Adding you…" : "Notify me when you open"}
      </button>

      {status === "failed" && (
        <p role="alert" className="signup__error signup__error--form">
          We couldn't add you just now. Please try again in a minute.
        </p>
      )}

      <p className="signup__fineprint">
        We'll only use your details to tell you about our opening. Read our{" "}
        <Link to="/privacy" className="text-link">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
