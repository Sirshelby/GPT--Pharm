import PageHeader from "../components/PageHeader.jsx";
import Faq from "../components/Faq.jsx";
import { business } from "../content/site.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

export default function FaqPage() {
  usePageTitle(
    "Questions and answers | GPT Pharm & Meds",
    "When we open, where we are, prescriptions, HMOs, delivery and how we use your details."
  );

  return (
    <>
      <PageHeader title="Questions people ask us">
        {business.email && (
          <p>
            Can't see yours? Email{" "}
            <a href={`mailto:${business.email}`} className="text-link">
              {business.email}
            </a>{" "}
            and we'll get back to you.
          </p>
        )}
      </PageHeader>
      <Faq />
    </>
  );
}
