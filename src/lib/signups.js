// Same pattern the database policy checks, so the two never disagree.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Slow mobile networks are common, but nobody should be left waiting forever.
const SAVE_TIMEOUT_MS = 15000;

/**
 * Tidies up what the visitor typed and checks it before we send anything.
 * Returns { entry } ready to insert, or { errors } keyed by field name.
 */
export function checkSignup({ fullName, email }) {
  const name = fullName.trim().replace(/\s+/g, " ");
  const address = email.trim();
  const errors = {};

  if (!name) errors.fullName = "Enter your name so we know who to greet.";
  else if (name.length > 100) errors.fullName = "Keep your name under 100 characters.";

  if (!address) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(address)) errors.email = "That email address doesn't look right. Check for typos.";
  else if (address.length > 255) errors.email = "Keep your email under 255 characters.";

  if (Object.keys(errors).length) return { errors };
  return { entry: { full_name: name, email: address.toLowerCase() } };
}

// Supabase is a big library and most visitors never submit the form, so we
// only download it once someone starts filling the form in.
const loadClient = () => import("./supabase.js");
export const warmUpSignup = loadClient;

export async function saveSignup(entry) {
  const { supabase } = await loadClient();

  if (!supabase) {
    throw new Error("Supabase client is missing. Check the environment variables.");
  }

  const { error } = await supabase
    .from("signups")
    .insert(entry)
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS));

  // 23505 is Postgres for "already exists". Signing up twice isn't a failure,
  // they're on the list either way.
  if (error && error.code !== "23505") {
    throw error;
  }
}
