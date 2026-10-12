import PageHeader from "../components/PageHeader.jsx";
import Services from "../components/Services.jsx";
import Prescriptions from "../components/Prescriptions.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

export default function ServicesPage() {
  usePageTitle(
    "Services | GPT Pharm & Meds, Abuja",
    "Prescriptions, pharmacist advice, blood pressure, blood sugar and malaria checks, ongoing medication, mother and baby care and delivery across Abuja."
  );

  return (
    <>
      <PageHeader title="Our services">
        <p>
          Everything you'd expect from a good neighbourhood pharmacy, done carefully and explained
          clearly. If you need something you can't see here, ask us. We'll tell you straight
          whether we can help.
        </p>
      </PageHeader>
      <Services />
      <Prescriptions />
    </>
  );
}
