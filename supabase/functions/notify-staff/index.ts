// Emails the pharmacy team when a new prescription request or message
// arrives. Supabase calls this through a database webhook (see the README
// for the two-minute setup) and we send the email through Resend.
//
// Settings, added with `npx supabase secrets set NAME=value`:
//   WEBHOOK_SECRET   any long random string; the webhook must send it too
//   RESEND_API_KEY   from resend.com
//   NOTIFY_FROM      e.g. "GPT Pharm & Meds <alerts@gptpharm.ng>"
//   NOTIFY_TO        who gets the emails, comma-separated
//   SITE_URL         e.g. https://gptpharm.ng

import { describe, type WebhookPayload } from "./message.ts";

const env = (name: string) => Deno.env.get(name) ?? "";

// Compare secrets in constant time, so the response time doesn't leak how
// many characters of a guess were right.
function sameSecret(a: string, b: string) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = env("WEBHOOK_SECRET");
  if (!secret || !sameSecret(request.headers.get("x-webhook-secret") ?? "", secret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Expected JSON", { status: 400 });
  }

  const email = describe(payload, env("SITE_URL").replace(/\/+$/, ""));
  if (!email) return new Response("Nothing to send", { status: 200 });

  const recipients = env("NOTIFY_TO").split(",").map((s) => s.trim()).filter(Boolean);
  if (!env("RESEND_API_KEY") || !env("NOTIFY_FROM") || recipients.length === 0) {
    console.error("notify-staff isn't fully configured; skipping email:", email.subject);
    return new Response("Not configured", { status: 500 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env("NOTIFY_FROM"), to: recipients, subject: email.subject, text: email.text }),
  });

  if (!response.ok) {
    // Logged in Supabase under Edge Functions > notify-staff > Logs
    console.error("Resend refused the email:", response.status, await response.text());
    return new Response("Email failed", { status: 502 });
  }

  return new Response("Sent", { status: 200 });
});
