import Hero from "../components/Hero.jsx";
import Services from "../components/Services.jsx";
import Promises from "../components/Promises.jsx";
import VisitSummary from "../components/VisitSummary.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

// The home page is a short tour: a taste of each part of the site, with a
// link through to the page that covers it properly.
export default function HomePage() {
  usePageTitle(
    "GPT Pharm & Meds | Pharmacy in Abuja",
    "A new community pharmacy in Abuja. Prescriptions, pharmacist advice, health checks and delivery across the city, with genuine NAFDAC-registered medicines only."
  );

  return (
    <>
      <Hero />
      <Services preview />
      <Promises preview />
      <VisitSummary />
    </>
  );
}
