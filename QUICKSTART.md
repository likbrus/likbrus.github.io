# 🚀 Quick Start Guide

## 1. Update Environment Variables

**IMPORTANT:** You MUST add your Supabase credentials to `.env.local`

Edit `c:\Users\lucas_zvdn1tc\Documents\brusapp\.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Project Settings → API

## 2. Start Development Server

```bash
npm run dev
```

Then open: http://localhost:3000

## 3. Create Supabase Database

Go to your Supabase project SQL Editor and copy-paste the SQL from **SETUP_GUIDE.md**

## 4. Create Admin User

1. Sign up in the app (email + password)
2. Copy your user ID from Supabase Auth
3. Run in SQL Editor:
   ```sql
   INSERT INTO admin_users (user_id) VALUES ('your-user-id');
   ```

## 5. Add Products & Test

- Log in with your account
- Click "Admin" button
- Add a product (e.g., Cola)
- Go back to Dashboard
- Test "Solgt 1" button

## 6. Deploy to Vercel

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOU/brusapp
git push -u origin main
```

Then connect to Vercel and add env variables.

---

**For detailed help, see SETUP_GUIDE.md and README.md**
