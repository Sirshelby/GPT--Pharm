import LegalLayout from "./LegalLayout.jsx";
import { business } from "../content/site.js";

// Written for the Nigeria Data Protection Act 2023. Have it checked by your
// lawyer or data protection officer before launch, and update the date below
// whenever the wording changes.
const UPDATED = "12 October 2026";

const email = business.email ? (
  <a href={`mailto:${business.email}`} className="text-link">
    {business.email}
  </a>
) : (
  "the contact details below"
);

const sections = [
  {
    title: "Who we are",
    body: (
      <p>
        {business.name} is a pharmacy in {business.city}, {business.region}, Nigeria. We are the
        data controller for the personal information collected through this website, which means we
        decide how it's used and we're responsible for looking after it.
      </p>
    ),
  },
  {
    title: "What we collect",
    body: (
      <>
        <p>When you join our opening list, we collect your name and email address. That's all.</p>
        <p>
          We don't ask for health information, payment details or identity documents on this
          website, and we don't use advertising or analytics cookies. Like almost every website,
          the company that hosts it keeps short-term technical logs (such as IP addresses and
          browser types) to keep the site secure and working.
        </p>
      </>
    ),
  },
  {
    title: "How we use it, and why we're allowed to",
    body: (
      <>
        <p>We use your name and email address only to:</p>
        <ul>
          <li>tell you when we have an opening date</li>
          <li>send you practical information about opening day, such as our address and hours</li>
        </ul>
        <p>
          We do this because you've given us your consent by signing up. You can withdraw it at any
          time by emailing {email}, and we'll remove you from the list. Technical logs are kept
          because we have a legitimate interest in keeping the website secure.
        </p>
      </>
    ),
  },
  {
    title: "Who we share it with",
    body: (
      <>
        <p>
          We never sell your information or give it to other businesses for their own marketing.
        </p>
        <p>
          We use trusted service providers to run this website and store the opening list. They
          process data only on our instructions and are bound to keep it secure. Some of them store
          data on servers outside Nigeria; where that happens, we rely on the safeguards the Nigeria
          Data Protection Act requires for transfers abroad.
        </p>
        <p>
          If a Google map is shown on our site, Google may collect information when you view or use
          it, under Google's own privacy policy.
        </p>
      </>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <p>
        We keep your details until our opening announcements are finished, then delete them, unless
        you've separately agreed to hear from us after that. You can ask us to delete them sooner.
      </p>
    ),
  },
  {
    title: "How we keep it safe",
    body: (
      <p>
        The website uses an encrypted (HTTPS) connection, and the opening list can only be read by
        authorised members of our team. Nobody can view the list through the website itself.
      </p>
    ),
  },
  {
    title: "Your rights",
    body: (
      <>
        <p>Under the Nigeria Data Protection Act 2023 you have the right to:</p>
        <ul>
          <li>ask for a copy of the information we hold about you</li>
          <li>have it corrected if it's wrong</li>
          <li>have it deleted</li>
          <li>withdraw your consent at any time</li>
          <li>object to how we use it, or ask us to limit it</li>
          <li>receive it in a format you can take elsewhere</li>
        </ul>
        <p>
          To use any of these rights, email {email}. If you're unhappy with how we've handled your
          information, you can also complain to the{" "}
          <a href="https://ndpc.gov.ng" className="text-link" target="_blank" rel="noopener noreferrer">
            Nigeria Data Protection Commission
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "Children",
    body: (
      <p>
        This website isn't meant for people under 18, and we don't knowingly collect their details.
        If you think a child has signed up, contact us and we'll delete their information.
      </p>
    ),
  },
  {
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy, we'll update it here and change the date at the top. If the change
        affects how we use details you've already given us, we'll tell you by email first.
      </p>
    ),
  },
  {
    title: "Contact us",
    body: (
      <p>
        {business.name}, {business.address ?? `${business.city}, ${business.region}, Nigeria`}.
        {business.email && <> Email: {email}.</>}
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy policy"
      description={`How ${business.name} collects, uses and protects your personal information.`}
      updated={UPDATED}
      intro="We collect as little as we can, use it only for what we've said, and never sell it. Here are the details."
      sections={sections}
    />
  );
}
