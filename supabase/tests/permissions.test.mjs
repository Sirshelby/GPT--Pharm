// Runs the real migrations inside an embedded Postgres that mimics Supabase's
// roles, auth and storage schemas, then checks who can do what.
//
//   npm run test:db
//
// Run it after changing anything in supabase/migrations. Every line should
// say "ok"; a FAIL means someone can see or do something they shouldn't (or
// can't do something they should).
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

const MIG = process.argv[2] ?? "supabase/migrations";
const db = new PGlite();

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
    name text, owner uuid, created_at timestamptz default now(), unique (bucket_id, name));
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
  grant select on storage.buckets to anon, authenticated;
  -- Supabase hands every new table in public to anon/authenticated by default;
  -- the migrations have to take that away themselves.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
`);

for (const f of readdirSync(MIG).sort()) {
  await db.exec(readFileSync(`${MIG}/${f}`, "utf8"));
  console.log("applied", f);
}
// run twice to prove the migrations are safe to re-run
for (const f of readdirSync(MIG).sort()) await db.exec(readFileSync(`${MIG}/${f}`, "utf8"));
console.log("re-applied all migrations cleanly\n");

const STAFF = "11111111-1111-4111-8111-111111111111";
const ADMIN = "22222222-2222-4222-8222-222222222222";
const RANDO = "33333333-3333-4333-8333-333333333333";
await db.exec(`
  insert into auth.users values ('${STAFF}','staff@x.ng'),('${ADMIN}','admin@x.ng'),('${RANDO}','rando@x.ng');
  insert into public.staff_members values ('${STAFF}','Ada Staff','pharmacist'),('${ADMIN}','Bayo Admin','admin');
  insert into public.products (slug,name,is_published) values ('pub-item','Published item',true),('draft-item','Draft item',false);
`);

let pass = 0, fail = 0;
async function as(role, uid, sql, params = []) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? ""]);
  await db.exec(`set role ${role}`);
  try { const r = await db.query(sql, params); return { rows: r.rows, affected: r.affectedRows }; }
  catch (e) { return { error: e.message, code: e.code }; }
  finally { await db.exec("reset role"); }
}
function check(name, ok, detail) {
  if (ok) { pass++; console.log("  ok  ", name); }
  else { fail++; console.log("  FAIL", name, JSON.stringify(detail)); }
}
const denied = (r) => r.error && /permission denied|row-level security/.test(r.error);
const uuid = () => crypto.randomUUID();

console.log("Visitors (anon)");
let r = await as("anon", null, "insert into public.signups (full_name,email) values ('Amaka','amaka@x.ng')");
check("can join the opening list", !r.error, r);
r = await as("anon", null, "insert into public.signups (full_name,email) values ('Amaka','AMAKA@x.ng')");
check("same email twice is rejected as a duplicate (23505)", r.code === "23505", r);
r = await as("anon", null, "select * from public.signups");
check("cannot read the opening list", denied(r), r);
r = await as("anon", null, "select slug from public.products order by slug");
check("sees only published products", r.rows?.length === 1 && r.rows[0].slug === "pub-item", r);
r = await as("anon", null, "insert into public.products (slug,name) values ('hack','Hack')");
check("cannot add products", denied(r), r);
r = await as("anon", null, "update public.products set name='x'");
check("cannot edit products", denied(r), r);
r = await as("anon", null, "insert into public.enquiries (full_name,email,message) values ('a','a@b.co','hello there')");
check("cannot write enquiries directly", denied(r), r);
r = await as("anon", null, "select public.submit_enquiry(full_name=>'Tunde', email=>'Tunde@Example.com', message=>'Do you stock insulin pens?', topic=>'product', product_slug=>'pub-item') as id");
check("can send an enquiry through submit_enquiry()", r.rows?.[0]?.id, r);
r = await as("anon", null, "select public.submit_enquiry(full_name=>'T', email=>'not-an-email', message=>'hello there')");
check("bad email is refused with PT400", r.code === "PT400", r);
r = await as("anon", null, "select public.submit_enquiry(full_name=>'T', email=>'t@x.co', message=>'hi')");
check("too-short message is refused with PT400", r.code === "PT400", r);
for (let i = 0; i < 2; i++) await as("anon", null, "select public.submit_enquiry(full_name=>'Tunde', email=>'tunde@example.com', message=>'Another question here')");
r = await as("anon", null, "select public.submit_enquiry(full_name=>'Tunde', email=>'tunde@example.com', message=>'Fourth message this hour')");
check("4th enquiry in an hour is slowed down with PT429", r.code === "PT429", r);
r = await as("anon", null, "select * from public.enquiries");
check("cannot read enquiries", denied(r), r);

const file1 = `incoming/${uuid()}.jpg`;
r = await as("anon", null, "insert into storage.objects (bucket_id,name) values ('prescriptions',$1)", [file1]);
check("can upload a prescription photo to incoming/", !r.error, r);
r = await as("anon", null, "insert into storage.objects (bucket_id,name) values ('prescriptions','somewhere/else.jpg')");
check("cannot upload anywhere else in the bucket", denied(r), r);
r = await as("anon", null, "insert into storage.objects (bucket_id,name) values ('prescriptions','incoming/../../evil.exe')");
check("cannot upload odd file names or types", denied(r), r);
r = await as("anon", null, "insert into storage.objects (bucket_id,name) values ('product-images','x.jpg')");
check("cannot upload product photos", denied(r), r);
r = await as("anon", null, "select name from storage.objects");
check("cannot list or open any uploaded files", r.rows?.length === 0, r);
r = await as("anon", null, "delete from storage.objects");
check("cannot delete uploaded files", r.affected === 0 || denied(r), r);

const submit = (o) => as("anon", null,
  `select public.submit_prescription_request(kind=>$1, full_name=>$2, phone=>$3, fulfilment=>$4, consent=>$5,
     email=>$6, medicines=>$7, file_path=>$8, delivery_address=>$9, notes=>$10) as ref`,
  [o.kind, o.name ?? "Chioma Eze", o.phone ?? "0803 123 4567", o.fulfil ?? "pickup", o.consent ?? true,
   o.email ?? null, o.meds ?? null, o.file ?? null, o.address ?? null, o.notes ?? null]);

r = await submit({ kind: "new", file: file1, fulfil: "delivery", address: "12 Example Close, Wuse 2" });
check("can send a new prescription and gets an RX- reference", /^RX-[2-9A-HJ-NP-Z]{6}$/.test(r.rows?.[0]?.ref ?? ""), r);
r = await submit({ kind: "new", file: file1 });
check("the same uploaded file can't be sent twice", r.code === "PT400", r);
r = await submit({ kind: "new", file: `incoming/${uuid()}.jpg` });
check("a file that was never uploaded is refused", r.code === "PT400", r);
r = await submit({ kind: "new" });
check("a new prescription without a file is refused", r.code === "PT400", r);
r = await submit({ kind: "refill" });
check("a refill without medicines listed is refused", r.code === "PT400", r);
r = await submit({ kind: "refill", meds: "Amlodipine 5mg", consent: false });
check("nothing is accepted without consent", r.code === "PT400", r);
r = await submit({ kind: "refill", meds: "Amlodipine 5mg", fulfil: "delivery" });
check("delivery without an address is refused", r.code === "PT400", r);
r = await submit({ kind: "refill", meds: "Amlodipine 5mg", phone: "call me" });
check("a nonsense phone number is refused", r.code === "PT400", r);
r = await submit({ kind: "refill", meds: "Amlodipine 5mg", phone: "+234 803 123 4567" });
check("a refill with medicines listed is accepted", r.rows?.[0]?.ref, r);
for (let i = 0; i < 3; i++) await submit({ kind: "refill", meds: "Metformin 500mg" });
r = await submit({ kind: "refill", meds: "Metformin 500mg" });
check("6th request from one phone number in a day is slowed down (PT429)", r.code === "PT429", r);
r = await as("anon", null, "select * from public.prescription_requests");
check("cannot read prescription requests", denied(r), r);
r = await as("anon", null, "update public.prescription_requests set status='completed'");
check("cannot change prescription requests", denied(r), r);
r = await as("anon", null, "select * from public.prescription_request_events");
check("cannot read request history", denied(r), r);
r = await as("anon", null, "select public.is_staff() as s");
check("is not treated as staff", r.rows?.[0]?.s === false, r);

console.log("\nLogged in, but not on the staff list");
for (const [label, sql] of [
  ["sign-ups", "select * from public.signups"],
  ["enquiries", "select * from public.enquiries"],
  ["prescription requests", "select * from public.prescription_requests"],
  ["prescription files", "select * from storage.objects where bucket_id='prescriptions'"],
  ["draft products", "select * from public.products where not is_published"],
  ["staff list", "select * from public.staff_members"],
]) {
  r = await as("authenticated", RANDO, sql);
  check(`sees no ${label}`, r.rows?.length === 0 || denied(r), r);
}
r = await as("authenticated", RANDO, "update public.prescription_requests set status='completed'");
check("cannot change requests", r.affected === 0, r);
r = await as("authenticated", RANDO, `insert into public.staff_members values ('${RANDO}','Me','admin')`);
check("cannot make themselves staff", denied(r), r);

console.log("\nStaff (pharmacist)");
r = await as("authenticated", STAFF, "select reference, status from public.prescription_requests order by created_at");
check("can read prescription requests", r.rows?.length === 5, r);
const firstRef = r.rows[0].reference;
r = await as("authenticated", STAFF, "update public.prescription_requests set status='reviewing', staff_notes='Called patient' where reference=$1", [firstRef]);
check("can move a request along and add notes", r.affected === 1, r);
r = await as("authenticated", STAFF, "select e.status, e.changed_by from public.prescription_request_events e join public.prescription_requests p on p.id=e.request_id where p.reference=$1 order by e.id", [firstRef]);
check("history records each status and who changed it", r.rows?.length === 2 && r.rows[1].status === "reviewing" && r.rows[1].changed_by === STAFF, r);
r = await as("authenticated", STAFF, "update public.prescription_requests set full_name='Someone else' where reference=$1", [firstRef]);
check("cannot rewrite what the customer sent", denied(r), r);
r = await as("authenticated", STAFF, "update public.prescription_requests set status='lost'");
check("cannot set a made-up status", r.code === "23514", r);
r = await as("authenticated", STAFF, "delete from public.prescription_requests");
check("cannot delete requests (admins only)", r.affected === 0, r);
r = await as("authenticated", STAFF, "select name from storage.objects where bucket_id='prescriptions'");
check("can open prescription files", r.rows?.length === 1, r);
r = await as("authenticated", STAFF, "delete from storage.objects where bucket_id='prescriptions'");
check("cannot delete prescription files (admins only)", r.affected === 0, r);
r = await as("authenticated", STAFF, "select * from public.enquiries");
check("can read enquiries", r.rows?.length === 3, r);
r = await as("authenticated", STAFF, "update public.enquiries set status='replied', staff_notes='Emailed back', handled_by=$1", [STAFF]);
check("can mark enquiries replied", r.affected === 3, r);
r = await as("authenticated", STAFF, "update public.enquiries set message='edited'");
check("cannot edit a customer's message", denied(r), r);
r = await as("authenticated", STAFF, "select * from public.signups");
check("can read the opening list", r.rows?.length === 1, r);
r = await as("authenticated", STAFF, "delete from public.signups");
check("cannot delete sign-ups (admins only)", r.affected === 0, r);
r = await as("authenticated", STAFF, "select slug from public.products");
check("can see draft products too", r.rows?.length === 2, r);
r = await as("authenticated", STAFF, "insert into public.products (slug,name,price,in_stock,is_published) values ('ors-sachets','ORS sachets',1500,true,true)");
check("can add a product", !r.error, r);
r = await as("authenticated", STAFF, "insert into public.products (slug,name,requires_prescription,is_published) values ('amoxicillin','Amoxicillin 500mg',true,true)");
check("cannot publish a prescription-only medicine", r.code === "23514", r);
r = await as("authenticated", STAFF, "update public.product_categories set name='Pain relief' where slug='pain-and-fever'");
check("can rename a category", r.affected === 1, r);
r = await as("authenticated", STAFF, "insert into storage.objects (bucket_id,name) values ('product-images','ors.jpg')");
check("can upload product photos", !r.error, r);
r = await as("authenticated", STAFF, `insert into public.staff_members values ('${RANDO}','New person','staff')`);
check("cannot add staff (admins only)", denied(r), r);

console.log("\nAdmin");
r = await as("authenticated", ADMIN, `insert into public.staff_members values ('${RANDO}','New person','staff')`);
check("can add a staff member", !r.error, r);
r = await as("authenticated", ADMIN, "delete from public.signups where lower(email)='amaka@x.ng'");
check("can remove someone from the opening list", r.affected === 1, r);
r = await as("authenticated", ADMIN, "delete from storage.objects where bucket_id='prescriptions'");
check("can delete prescription files", r.affected === 1, r);
r = await as("authenticated", ADMIN, "delete from public.prescription_requests where reference=$1", [firstRef]);
check("can delete a request (and its history goes with it)", r.affected === 1, r);
r = await as("authenticated", ADMIN, "select count(*)::int as n from public.prescription_request_events e where not exists (select 1 from public.prescription_requests p where p.id=e.request_id)");
check("no orphaned history left behind", r.rows?.[0]?.n === 0, r);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
