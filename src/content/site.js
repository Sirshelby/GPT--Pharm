// Everything a non-developer is likely to change lives in this file:
// contact details, address, hours, opening date and the words on the page.
//
// Anything set to null is simply left off the site, so it's safe to launch
// before every detail is confirmed. Fill them in as they become real.
// Please don't put placeholder numbers here; people will try to call them.

export const business = {
  name: "GPT Pharm & Meds",
  city: "Abuja",
  region: "Federal Capital Territory",

  // e.g. "Plot 1234, Aminu Kano Crescent, Wuse 2, Abuja"
  // Once this is set, the map and the "Get directions" button appear.
  address: null,

  // Format: "YYYY-MM-DD". Shown in the hero and FAQ. From this date on,
  // the site says "Now open" instead of "Opening soon".
  openingDate: null,

  // Write the phone number the way people should see it. We strip the
  // spaces out for the tel: link. e.g. "+234 809 123 4567"
  phone: null,

  // International format, digits only, no "+". e.g. "2348091234567"
  whatsapp: null,

  email: "hello@gptpharm.ng",

  // Premises registration number from the Pharmacy Council of Nigeria.
  // Shown in the footer once you have it, as patients and inspectors expect.
  pcnPremisesNumber: null,

  // Full profile URLs. Leave as null to hide.
  social: {
    instagram: null,
    facebook: null,
    x: null,
  },
};

// Opening hours from day one. The order here is the order on the page.
export const openingHours = [
  { days: "Monday to Saturday", opens: "08:00", closes: "21:00" },
  { days: "Sunday", opens: "10:00", closes: "18:00" },
];

export const deliveryAreas = ["Wuse", "Maitama", "Garki", "Asokoro", "Gwarinpa"];

// The pages in the main menu, in order. Each one has a file in src/pages.
export const navLinks = [
  { to: "/services", label: "Services" },
  { to: "/about", label: "About us" },
  { to: "/visit", label: "Visit us" },
  { to: "/faq", label: "FAQ" },
];

export const services = [
  {
    icon: "prescription",
    title: "Prescriptions",
    body: "Bring your prescription in or send us a photo. A pharmacist checks every item, explains how to take it and flags anything that shouldn't be mixed.",
  },
  {
    icon: "chat",
    title: "Ask a pharmacist",
    body: "Not sure whether you need a doctor? Talk it through with a pharmacist first, somewhere quiet where you won't be overheard.",
  },
  {
    icon: "heart",
    title: "Health checks",
    body: "Blood pressure, blood sugar and malaria rapid tests while you wait, with the results explained in plain language.",
  },
  {
    icon: "calendar",
    title: "Ongoing medication",
    body: "Living with hypertension, diabetes or asthma? We keep your regular medicines in stock and remind you before you run out.",
  },
  {
    icon: "baby",
    title: "Mother and baby",
    body: "Antenatal vitamins, infant formula and baby essentials, plus patient answers to the questions every new parent has.",
  },
  {
    icon: "leaf",
    title: "Wellness and personal care",
    body: "Vitamins, skincare and everyday essentials, chosen with Abuja's heat and harmattan dust in mind.",
  },
];

// These really are steps in order, which is why they're numbered on the page.
export const prescriptionSteps = [
  {
    title: "Send it over",
    body: "Send a clear photo of your prescription on WhatsApp, or bring the paper copy to the counter.",
  },
  {
    title: "We check it",
    body: "A pharmacist reviews it, confirms what we have and what it costs, and calls you if anything needs clarifying.",
  },
  {
    title: "Collect or have it delivered",
    body: "Pick it up when it suits you, or we'll bring it to your home or office anywhere we deliver in Abuja.",
  },
];

export const promises = [
  {
    title: "Genuine medicines, nothing else",
    body: "We buy only from NAFDAC-registered manufacturers and licensed distributors, and we check batch numbers and expiry dates on every delivery we receive.",
  },
  {
    title: "A pharmacist on duty",
    body: "A pharmacist registered with the Pharmacy Council of Nigeria is in the shop whenever we're open, so your questions get a proper answer.",
  },
  {
    title: "Your health stays private",
    body: "What you tell us stays between you and the pharmacist. We keep records only where the law requires it.",
  },
  {
    title: "Prices before you pay",
    body: "We tell you the price before we dispense anything, and we'll suggest a trusted generic when there is one.",
  },
];

// Answers that depend on the opening date or address are filled in by the
// FAQ component, so they stay correct when those details change.
export const faqs = [
  { id: "opening", question: "When are you opening?" },
  { id: "where", question: "Where exactly are you?" },
  {
    id: "prescription",
    question: "Do I need a prescription?",
    answer:
      "For prescription-only medicines, yes. Nigerian law requires one and we follow it. For everyday medicines and health products, just come in or ask us.",
  },
  {
    id: "hmo",
    question: "Can I pay with my HMO?",
    answer:
      "We're setting up arrangements with HMOs that operate in Abuja. Ask us which plans we accept before you visit, and we'll keep this page updated as more come on board.",
  },
  {
    id: "delivery",
    question: "Do you deliver?",
    answer: `Yes, within Abuja, including ${deliveryAreas.slice(0, -1).join(", ")} and ${deliveryAreas.at(-1)}. The fee depends on distance, and we'll always confirm it before anything goes out.`,
  },
  {
    id: "email",
    question: "What will you do with my email address?",
    answer:
      "Only tell you when we open and share opening-day details. We won't sell it or pass it on, and you can ask us to delete it at any time.",
  },
];
