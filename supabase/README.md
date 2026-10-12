# Backend setup (Supabase)

Everything the website stores lives in one Supabase project: the opening list, contact-form messages, prescription requests and their photos, the product catalogue, and staff logins. This guide sets it up from scratch. Allow about 20 minutes.

You'll need Node 20.19 or newer, and a free account at [supabase.com](https://supabase.com).

## What's in this folder

| Path | What it is |
| --- | --- |
| `migrations/` | The database, in order: tables, security rules, storage buckets and the functions the website calls. Safe to run more than once. |
| `functions/notify-staff/` | A small server function that emails your team when a request or message comes in. Optional. |
| `tests/` | Permission tests. Run `npm run test:db` from the project root. |
| `seed.sql` | Example products, for local development only. Never added to the live database. |
| `config.toml` | Settings for the Supabase command-line tool. |

## A note on your existing project

The first version of the site saved sign-ups to a Supabase project that Lovable created. If you can open that project at supabase.com, you can use it: the migrations keep the existing `signups` table and the people already on it.

If you can't open it there (Lovable Cloud projects are sometimes only reachable through Lovable), create a new project of your own. Export the opening list from Lovable first, then import the rows into the new `signups` table using the Table Editor's CSV import.

## 1. Create the project

1. In the Supabase dashboard, click **New project**.
2. Pick the region closest to Abuja and set a strong database password. Save it in a password manager.
3. Wait a minute or two while it's created.

## 2. Create the database

From the project folder on your computer:

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF   # the ref is in the dashboard URL
npx supabase db push
```

`db push` runs everything in `migrations/` in order.

**No terminal?** Open **SQL Editor** in the dashboard and run each file in `migrations/` one at a time, oldest first, pasting each file's contents and clicking **Run**.

## 3. Lock down logins

Only your staff should ever be able to log in.

1. **Authentication → Sign In / Providers:** turn **off** "Allow new users to sign up". Your team will be invited instead.
2. **Authentication → URL Configuration:**
   - **Site URL:** `https://YOUR-DOMAIN/staff/set-password`
   - **Redirect URLs:** add `https://YOUR-DOMAIN/staff/set-password` and, for local testing, `http://localhost:5173/staff/set-password`

The Site URL looks odd, but it's right: the only emails Supabase sends are staff invites and password resets, and both should land on the page where staff choose a password.

## 4. Connect the website

In **Project Settings → API Keys**, copy:

- the **Project URL**, into `VITE_SUPABASE_URL`
- the **Publishable key**, into `VITE_SUPABASE_PUBLISHABLE_KEY` (if you only see "anon", that's the same thing under its older name)

Put both in `.env` for local work and in your host's environment settings (Vercel or Netlify) for the live site, then redeploy.

**Never** use the secret key (sometimes called `service_role`) on the website. It skips every security rule.

## 5. Add yourself as the first admin

1. **Authentication → Users → Invite user:** enter your email. Open the invite email, follow the link and choose a password.
2. **SQL Editor:** run this, with your own name and email:

   ```sql
   insert into public.staff_members (user_id, full_name, role)
   select id, 'Your Name', 'admin'
   from auth.users
   where email = 'you@example.com';
   ```

3. Go to `https://YOUR-DOMAIN/staff` and log in.

## Adding staff

Do the same as step 5, with their email and the role `pharmacist` or `staff` instead of `admin`. Admins are the only ones who can permanently delete records, so keep that to one or two people.

**When someone leaves**, remove their access straight away:

```sql
delete from public.staff_members
where user_id = (select id from auth.users where email = 'them@example.com');
```

Then delete them under **Authentication → Users** too. The history of what they did stays, shown as "a former staff member".

## 6. Email alerts (optional, recommended)

Without this, new requests and messages still appear in the dashboard; nobody gets told about them. The emails never contain health details, only a reference number and a link to the dashboard.

1. Create a free account at [resend.com](https://resend.com), add your domain (e.g. `gptpharm.ng`) and follow its steps to verify it. Then create an API key.
2. Deploy the function and give it its settings:

   ```bash
   npx supabase functions deploy notify-staff --no-verify-jwt

   npx supabase secrets set \
     WEBHOOK_SECRET="$(openssl rand -hex 32)" \
     RESEND_API_KEY="re_..." \
     NOTIFY_FROM="GPT Pharm & Meds <alerts@gptpharm.ng>" \
     NOTIFY_TO="pharmacist@gptpharm.ng,manager@gptpharm.ng" \
     SITE_URL="https://gptpharm.ng"
   ```

   Note down the `WEBHOOK_SECRET` value you set. You can view it again with `npx supabase secrets list`.

3. **Database → Webhooks → Create a new hook**, twice:

   | | First hook | Second hook |
   | --- | --- | --- |
   | Name | `notify-prescriptions` | `notify-messages` |
   | Table | `prescription_requests` | `enquiries` |
   | Events | Insert | Insert |
   | Type | HTTP request, POST | HTTP request, POST |
   | URL | `https://YOUR-PROJECT-REF.supabase.co/functions/v1/notify-staff` | same |
   | HTTP header | `x-webhook-secret` = your `WEBHOOK_SECRET` | same |

4. Send a test message from the Contact page. If no email arrives, check **Edge Functions → notify-staff → Logs**.

## 7. Open the prescription form

The form on `/prescriptions` opens by itself on the `openingDate` set in `src/content/site.js`. To open it earlier, for example for a soft launch, set `acceptPrescriptionRequests: true` there.

## Looking after the data

The privacy policy makes promises about how long you keep things, so put a reminder in the diary to keep them:

- **Opening list:** download it from the dashboard after launch, send your announcements, then ask an admin to clear it (or run `delete from public.signups;` in the SQL Editor).
- **Messages:** delete ones older than a year.
- **Prescription requests:** keep them as long as pharmacy regulations require, then delete them. Deleting from the dashboard removes the photo too.
- **When someone asks for their data to be deleted**, an admin can do it from the dashboard. Check first whether the law requires you to keep a record of medicines supplied.

**Backups:** check what your Supabase plan includes under **Database → Backups**. Paid plans add point-in-time recovery, which is worth having once you're handling real prescriptions.

## Changing the database later

Never edit an existing migration file once it's been pushed. Add a new one instead:

```bash
npx supabase migration new describe_your_change
# write the SQL in the new file, then:
npm run test:db          # check nobody can see or do more than they should
npx supabase db push
```

## How the security works, in one paragraph

Every table has row-level security switched on. Visitors (the publishable key) can read published products and categories, add themselves to the opening list, and send messages and prescription requests through two checked database functions, `submit_enquiry` and `submit_prescription_request`. Those functions validate everything, need consent for prescriptions, check that an uploaded photo really exists, and slow down anyone sending too many. Visitors can upload a prescription photo into a private bucket, but can't list, open or replace any file in it, including their own. Logged-in users see nothing unless they're in `staff_members`. Staff can update the status and notes on a request, but can't change what the customer sent. Only admins can delete. `npm run test:db` checks all of this.
