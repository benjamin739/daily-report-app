# Daily Report App — Setup Guide

## Step 1: Supabase Setup

1. Go to supabase.com and open your project
2. Go to **Settings → API**
3. Copy these values into your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL` = "Project URL"
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = "anon public" key
   - `SUPABASE_SERVICE_ROLE_KEY` = "service_role" key (keep this secret!)

4. Go to **Storage** → Create a new bucket called `photos`
   - Set it to **Public** so Notion can display the images

5. Create your admin account:
   - Go to **Authentication → Users → Add user**
   - Enter your email and a strong password
   - After creating, click the user → Edit → add to "User Metadata":
     ```json
     { "role": "admin", "full_name": "Your Name" }
     ```

## Step 2: Notion Setup

1. Go to notion.so → **Settings & Members → Integrations**
2. Click **"Develop your own integrations"** → New integration
3. Name it "Daily Report App", choose your workspace → Submit
4. Copy the **Internal Integration Secret** → paste as `NOTION_API_KEY` in `.env.local`

5. Open your **Daily Report** database in Notion
6. Click **"..."** menu top right → **Connections** → Add your new integration

7. Get your Database ID:
   - Look at your Notion database URL:
     `https://www.notion.so/YOUR-WORKSPACE/XXXXXXXXXXXXXXXX?v=...`
   - The `XXXXXXXXXXXXXXXX` part (32 characters) is your Database ID
   - Paste it as `NOTION_DATABASE_ID` in `.env.local`

8. Make sure your Notion database has these properties (exact names matter):
   - `Date` (type: Date)
   - `Project Name` (type: Text)
   - `Status` (type: Select)
   - `Office` (type: Text)
   - `Activity` (type: Text)
   - `Activity on Site` (type: Text)
   - `Foreman Name` (type: Text)
   - `Workers Names` (type: Text)
   - `Workers Hours` (type: Text)
   - `Tools` (type: Text)
   - `Tomorrow's Goal` (type: Text)
   - `Unforeseen` (type: Text)
   - `Safety Meeting` (type: Checkbox)
   - `Pictures` (type: Files & Media)
   - `Sign Sheet` (type: Files & Media)

## Step 3: Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to vercel.com → New Project → Import your GitHub repo
3. In **Environment Variables**, add all 5 variables from your `.env.local`
4. Click Deploy — your app will be live in ~2 minutes!

## Step 4: Add Foremen

1. Go to `your-app-url.vercel.app/admin`
2. Sign in with your admin account
3. Click "Manage Foremen" → "Add New Foreman"
4. Enter their name, email, and a temporary password
5. Share the app URL and their login with each foreman

## Foremen Install on Phone

1. Open the app URL in Safari (iPhone) or Chrome (Android)
2. Tap the **Share** button → **"Add to Home Screen"**
3. The app will install like a native app!
