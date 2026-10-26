# Fitness Incentive — QR Workout Tracker

A mobile web app. Every machine in the gym has a QR code. A member scans it,
logs in with their phone number, sees what they did last time on that machine,
and logs today's sets. Staff get a dashboard showing inactive members, personal
records, and the most-used machines.

## What's inside

| Page | Who | What it does |
| --- | --- | --- |
| `/m/<machine id>` | Members | The page a QR code opens. Top: last session + "Full history". Bottom: log today's sets (pre-filled from last time). |
| `/login` | Members | Phone number → 6-digit text code. Members stay logged in on their phone. |
| `/staff` | Staff | Inactive members (14 days by default, adjustable) and most-used machines. |
| `/staff/members` | Staff | Search members. Click one to see their personal records and full history. |
| `/staff/machines` | Staff | Add or edit machines (name, optional photo) and print QR codes. |

Built with **Next.js** (the website), **Supabase** (the database and logins) and
**Vercel** (hosting). Text messages are sent by **Twilio** through Supabase.

---

## Setup, step by step

You'll need free accounts at [supabase.com](https://supabase.com),
[vercel.com](https://vercel.com), [github.com](https://github.com) and
[twilio.com](https://twilio.com).

### 1. Create the database (Supabase)

1. In Supabase, click **New project**. Pick any name and a strong database password. Wait about 2 minutes for it to finish.
2. In the left menu, open **SQL Editor** → **New query**.
3. Open the file `supabase/schema.sql` from this project, copy everything, paste it in, and click **Run**. You should see "Success".

### 2. Turn on phone logins (Twilio)

1. In Twilio, buy a phone number and create a **Messaging Service** that uses it.
   Note your **Account SID**, **Auth Token** and **Messaging Service SID**.
2. In Supabase, go to **Authentication → Sign In / Providers → Phone**. Turn it on, choose **Twilio**, paste the three values, and save.

> **Testing without real texts:** on that same Phone settings page you can add
> *test phone numbers* with a fixed code (e.g. `15555550100=123456`). Logging in
> with that number accepts that code and sends no text.
>
> **US texting rule:** before Twilio will deliver texts to US phones, it requires
> you to register your business (called "A2P 10DLC", or use a verified toll-free
> number). Twilio walks you through it. Start early, since approval can take days.

### 3. Create your staff login

1. In Supabase, go to **Authentication → Users → Add user → Create new user**.
   Enter your email and a password, and tick **Auto Confirm User**.
2. Back in **SQL Editor**, run this (with your email):

   ```sql
   update profiles set role = 'staff'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

Repeat for each staff member.

### 4. Run it on your computer (optional, for trying things out)

1. Install **Node.js** (the "LTS" version) from [nodejs.org](https://nodejs.org).
2. Open a terminal in this project folder and run:

   ```bash
   npm install
   cp .env.local.example .env.local
   ```

3. Open `.env.local` and fill in the two Supabase values. They're in Supabase under
   **Project Settings → API** ("Project URL" and the "anon public" key).
4. Run:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000. Staff log in at http://localhost:3000/staff-login.

### 5. Put it online (Vercel)

1. Put this project on GitHub.
2. In Vercel, click **Add New → Project**, pick the GitHub repository, and before clicking Deploy open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`: same as in `.env.local`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: same as in `.env.local`
   - `NEXT_PUBLIC_SITE_URL`: your site address, e.g. `https://fitness-incentive.vercel.app`
     (you can add this after the first deploy, once you know the address, then click **Redeploy**)
3. Click **Deploy**.

### 6. Add machines and print the QR codes

1. Go to `https://<your site>/staff-login` and log in.
2. Open **Machines**, add each machine, then click **Print all QR codes**.
3. Print the page, cut out the cards, and stick one on each machine.

The QR codes contain your site address, so **print them after** setting
`NEXT_PUBLIC_SITE_URL` to your real address (step 5), not localhost. A
machine's QR code keeps working when you rename it, and stops working if you
delete it.

---

## Ideas for later

- Let members edit or delete a workout they logged by mistake
- Progress charts per machine
- Text inactive members a "we miss you" message from the dashboard
- Show a member a "New personal record!" message when they beat their best
