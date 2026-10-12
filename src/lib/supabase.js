import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.warn(
    "Supabase isn't configured, so the sign-up form can't save anything. " +
      "Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example)."
  );
}

// Visitors never log in here, so there's no session worth keeping around.
export const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
