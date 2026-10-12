// Works out what the notification email says. Kept separate from index.ts
// so it can be tested without a server.
//
// The golden rule: no health details in email. Email gets forwarded,
// synced to phones and left open on screens. The email says something
// arrived and links to the dashboard, where it's behind a login.

export type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
};

export type Email = { subject: string; text: string };

const TOPICS: Record<string, string> = {
  general: "a general question",
  product: "a product or price",
  delivery: "delivery",
  feedback: "feedback",
  other: "something else",
};

export function describe(payload: WebhookPayload, dashboardUrl: string): Email | null {
  if (payload.type !== "INSERT" || payload.schema !== "public" || !payload.record) return null;
  const r = payload.record;

  if (payload.table === "prescription_requests") {
    const kind = r.kind === "refill" ? "Refill request" : "New prescription";
    const how = r.fulfilment === "delivery" ? "for delivery" : "for pickup";
    return {
      subject: `${kind} ${r.reference} (${how})`,
      text: [
        `${kind} ${r.reference} has just come in, ${how}.`,
        "",
        `Open it in the dashboard: ${dashboardUrl}/staff/prescriptions/${r.id}`,
        "",
        "The customer's details are only in the dashboard, not in this email.",
      ].join("\n"),
    };
  }

  if (payload.table === "enquiries") {
    const firstName = String(r.full_name ?? "Someone").trim().split(/\s+/)[0];
    const topic = TOPICS[String(r.topic)] ?? "a question";
    return {
      subject: `New message from ${firstName}`,
      text: [
        `${firstName} has sent a message about ${topic}.`,
        "",
        `Read and reply in the dashboard: ${dashboardUrl}/staff/enquiries`,
      ].join("\n"),
    };
  }

  return null;
}
