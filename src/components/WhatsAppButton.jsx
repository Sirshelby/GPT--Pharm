import Icon from "./Icon.jsx";
import { whatsappHref } from "../lib/business.js";
import "./WhatsAppButton.css";

// The floating chat button most people in Nigeria expect to find.
// Only shows up once a WhatsApp number is set in site.js.
export default function WhatsAppButton() {
  const href = whatsappHref("Hello, I have a question for the pharmacist.");
  if (!href) return null;

  return (
    <a href={href} className="whatsapp-button" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
      <Icon name="whatsapp" size={28} />
    </a>
  );
}
