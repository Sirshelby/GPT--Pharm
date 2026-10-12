// node --experimental-strip-types supabase/functions/notify-staff/message.test.ts
import assert from "node:assert/strict";
import { describe } from "./message.ts";

const site = "https://gptpharm.ng";
const rx = describe(
  {
    type: "INSERT",
    schema: "public",
    table: "prescription_requests",
    record: { id: "abc", reference: "RX-7KQ3MD", kind: "new", fulfilment: "delivery", full_name: "Chioma Eze",
              phone: "08031234567", medicines: "Amlodipine", notes: "allergic to penicillin" },
  },
  site
);
assert.ok(rx);
assert.equal(rx.subject, "New prescription RX-7KQ3MD (for delivery)");
assert.match(rx.text, /https:\/\/gptpharm\.ng\/staff\/prescriptions\/abc/);
for (const secret of ["Chioma", "0803", "Amlodipine", "penicillin"]) {
  assert.ok(!rx.subject.includes(secret) && !rx.text.includes(secret), `email leaked "${secret}"`);
}

const msg = describe(
  { type: "INSERT", schema: "public", table: "enquiries",
    record: { full_name: "Tunde Bakare", topic: "delivery", message: "Do you deliver to Kubwa?", email: "t@x.ng" } },
  site
);
assert.equal(msg?.subject, "New message from Tunde");
assert.ok(!msg.text.includes("Kubwa") && !msg.text.includes("t@x.ng"));

assert.equal(describe({ type: "UPDATE", schema: "public", table: "enquiries", record: {} }, site), null);
assert.equal(describe({ type: "INSERT", schema: "public", table: "signups", record: {} }, site), null);

console.log("notify-staff message tests passed");
