import PageHeader from "../components/PageHeader.jsx";
import Visit from "../components/Visit.jsx";
import { business } from "../content/site.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

export default function VisitPage() {
  usePageTitle(
    "Visit us | GPT Pharm & Meds, Abuja",
    `Address, opening hours, delivery areas and contact details for ${business.name} in Abuja.`
  );

  return (
    <>
      <PageHeader title="Visit us">
        <p>
          Walk in any time we're open. There's no need to book, and a pharmacist is always on hand.
          Can't make it in? We'll bring your medicines to you.
        </p>
      </PageHeader>
      <Visit />
    </>
  );
}
