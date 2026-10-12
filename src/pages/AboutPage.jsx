import { Link } from "react-router";

import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Promises from "../components/Promises.jsx";
import { business } from "../content/site.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import "./AboutPage.css";

// If you'd like to tell the founders' story here, the "Why we're opening"
// section is the place for it. Keep it short and in your own words.
export default function AboutPage() {
  usePageTitle(
    "About us | GPT Pharm & Meds, Abuja",
    `Why ${business.name} is opening in Abuja, and the standards we hold ourselves to.`
  );

  const safeguards = [
    {
      title: "Registered pharmacists",
      body: business.pcnPremisesNumber
        ? `Our pharmacists are registered with the Pharmacy Council of Nigeria, and so are our premises (registration ${business.pcnPremisesNumber}).`
        : "Our pharmacists are registered with the Pharmacy Council of Nigeria, and one is on duty whenever we're open.",
    },
    {
      title: "Medicines you can trust",
      body: "Every product we sell carries a NAFDAC registration number. We check it, along with the batch and expiry date, when stock arrives.",
    },
    {
      title: "Stored properly",
      body: "Medicines are kept the way their manufacturers specify, away from Abuja's heat, so they work the way they're meant to.",
    },
    {
      title: "Your information protected",
      body: (
        <>
          We handle personal details under the Nigeria Data Protection Act 2023. Our{" "}
          <Link to="/privacy" className="text-link">
            privacy policy
          </Link>{" "}
          explains how.
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="About us">
        <p>
          {business.name} is a new community pharmacy in {business.city}, built around two simple
          ideas: every medicine on our shelves should be genuine, and every customer should get
          proper advice.
        </p>
      </PageHeader>

      <section className="section" aria-labelledby="why-title">
        <div className="about-why container">
          <h2 id="why-title">Why we're opening</h2>
          <div className="about-why__body">
            <p>
              Too many people in Nigeria still have to wonder whether the medicine they've bought is
              real, or whether the person who sold it to them is qualified. That uncertainty costs
              money and, sometimes, health.
            </p>
            <p>
              We want to be the pharmacy in {business.city} where those questions never come up.
              Where you can ask a pharmacist anything without feeling rushed, get a straight answer
              about price, and trust that what's in the box is exactly what it says.
            </p>
          </div>
        </div>
      </section>

      <Promises />

      <section className="section" aria-labelledby="safeguards-title">
        <div className="container">
          <div className="section-heading">
            <h2 id="safeguards-title">Checked, licensed and accountable</h2>
            <p>
              Pharmacy in Nigeria is regulated for good reason. Here's what that means in practice
              at our counter.
            </p>
          </div>

          <ul className="safeguards">
            {safeguards.map((item) => (
              <li key={item.title} className="safeguard">
                <span className="safeguard__icon">
                  <Icon name="check" size={22} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
