import { Link } from "react-router";

import LegalLayout from "./LegalLayout.jsx";
import { business } from "../content/site.js";

// Have these checked by your lawyer before launch, and update the date
// below whenever the wording changes.
const UPDATED = "12 October 2026";

const sections = [
  {
    title: "About these terms",
    body: (
      <p>
        This website is run by {business.name}, a pharmacy in {business.city}, Nigeria. By using
        it, you agree to these terms. If you don't agree, please don't use the site.
      </p>
    ),
  },
  {
    title: "Not medical advice",
    body: (
      <>
        <p>
          The health information on this website is general. It isn't a diagnosis and it isn't a
          substitute for advice from a pharmacist, doctor or other health professional who knows
          your situation.
        </p>
        <p>
          Don't start, stop or change any medicine because of something you've read here without
          speaking to a professional first. In an emergency, go to the nearest hospital.
        </p>
      </>
    ),
  },
  {
    title: "Prescription medicines",
    body: (
      <p>
        We supply prescription-only medicines only against a valid prescription, as Nigerian law
        requires. Our pharmacists may decline to supply any medicine where they judge it isn't safe
        or appropriate, and they'll explain why.
      </p>
    ),
  },
  {
    title: "Information that may change",
    body: (
      <p>
        We work to keep this website accurate, but opening dates, services, hours, delivery areas and
        prices can change. If something matters to your plans, check with us first.
      </p>
    ),
  },
  {
    title: "Our opening list",
    body: (
      <p>
        Joining our opening list doesn't create an order, a reservation or any obligation on either
        side. Our <Link to="/privacy" className="text-link">privacy policy</Link> explains how we
        handle your details.
      </p>
    ),
  },
  {
    title: "Using this website",
    body: (
      <p>
        Please don't misuse the site: for example, by trying to break into it, overload it, send it
        automated sign-ups or use it for anything unlawful.
      </p>
    ),
  },
  {
    title: "Our content",
    body: (
      <p>
        The text, design and logo on this website belong to {business.name}. You're welcome to share
        links to it, but please don't copy our content for commercial use without asking us.
      </p>
    ),
  },
  {
    title: "Links to other websites",
    body: (
      <p>
        Where we link to other websites, such as Google Maps or WhatsApp, we're not responsible for
        their content or how they handle your information.
      </p>
    ),
  },
  {
    title: "Our responsibility to you",
    body: (
      <p>
        We provide this website as it is and can't promise it will always be available or free of
        errors. As far as the law allows, we aren't liable for losses that come from using it. None
        of this limits any rights you have under Nigerian consumer protection law.
      </p>
    ),
  },
  {
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of the Federal Republic of Nigeria, and the courts of
        the Federal Capital Territory have jurisdiction over any dispute.
      </p>
    ),
  },
  {
    title: "Contact us",
    body: (
      <p>
        Questions about these terms?{" "}
        {business.email ? (
          <>
            Email{" "}
            <a href={`mailto:${business.email}`} className="text-link">
              {business.email}
            </a>
            .
          </>
        ) : (
          "Ask us in store."
        )}
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of use"
      description={`The terms that apply when you use the ${business.name} website.`}
      updated={UPDATED}
      intro="The ground rules for using this website, written as plainly as we could."
      sections={sections}
    />
  );
}
