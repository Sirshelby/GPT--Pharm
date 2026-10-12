import { business } from "../content/site.js";

// Small helpers that turn the raw details in site.js into what the page
// actually shows, so components don't each reinvent the formatting.

// Abuja doesn't observe daylight saving, so a fixed offset is safe here.
const LAGOS_OFFSET = "+01:00";

function openingMoment() {
  if (!business.openingDate) return null;
  const date = new Date(`${business.openingDate}T00:00:00${LAGOS_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isOpen(now = new Date()) {
  const opening = openingMoment();
  return Boolean(opening && now >= opening);
}

// "Saturday, 5 December 2026" (or "5 Dec 2026" when short), or null if no
// date has been set yet.
export function formattedOpeningDate({ short = false } = {}) {
  const opening = openingMoment();
  if (!opening) return null;

  const style = short
    ? { day: "numeric", month: "short", year: "numeric" }
    : { weekday: "long", day: "numeric", month: "long", year: "numeric" };

  return new Intl.DateTimeFormat("en-NG", { ...style, timeZone: "Africa/Lagos" }).format(opening);
}

export function openingStatus() {
  if (isOpen()) return `Now open in ${business.city}`;
  const date = formattedOpeningDate();
  return date ? `Opening ${date}` : `Opening soon in ${business.city}`;
}

// "08:00" -> "8am", "21:30" -> "9:30pm"
export function friendlyTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  return minutes ? `${hour12}:${String(minutes).padStart(2, "0")}${suffix}` : `${hour12}${suffix}`;
}

export function phoneHref() {
  return business.phone ? `tel:${business.phone.replace(/[^\d+]/g, "")}` : null;
}

export function whatsappHref(message) {
  if (!business.whatsapp) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${business.whatsapp}${text}`;
}

export function mapLinks() {
  if (!business.address) return null;
  const query = encodeURIComponent(`${business.name}, ${business.address}`);

  return {
    embed: `https://www.google.com/maps?q=${query}&z=16&output=embed`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
  };
}
