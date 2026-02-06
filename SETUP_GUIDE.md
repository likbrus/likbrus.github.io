# 🥤 Brus Lager & Salg - Setup Guide

## Project Status: ✅ Frontend Complete

Your Next.js app is ready! Now you need to set up Supabase (backend & database).

---

## 📋 What's Included

✅ **Next.js 14+** with React Compiler & src/ directory
✅ **Tailwind CSS** for mobile-first design
✅ **TypeScript** for type safety
✅ **Authentication system** with email/password (Supabase Auth)
✅ **Dashboard** with inventory display & quick-sell buttons
✅ **Admin panel** for managing products, purchases & sales
✅ **Real-time updates** with Supabase subscriptions

---

## 🚀 Setup Steps (Required!)

### Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free tier is perfect for this project)
3. Create a new project
4. Copy your project URL and anonymous key from Project Settings → API

### Step 2: Create Database Schema

Go to **Supabase Dashboard → SQL Editor** and run these queries:

```sql
-- 1. Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  buy_price numeric NOT NULL,
  sell_price numeric NOT NULL,
  stock integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- 2. Purchases table (optional, for history)
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  price_per_unit numeric NOT NULL,
  created_at timestamp DEFAULT now()
);

-- 3. Sales table
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  profit numeric NOT NULL,
  created_at timestamp DEFAULT now()
);

-- 4. Admin users table (for checking admin role)
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id)
);
```

### Step 3: Set Up Row Level Security (RLS)

Enable RLS on all tables: **Supabase → Tables → [Table Name] → Security → RLS**

Then add these policies in SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for products
CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert products"
  ON products FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "Only admins can update products"
  ON products FOR UPDATE
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Policies for purchases
CREATE POLICY "Only admins can manage purchases"
  ON purchases FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Policies for sales (anyone logged in can insert sales)
CREATE POLICY "Anyone can read sales"
  ON sales FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert sales"
  ON sales FOR INSERT
  WITH CHECK (true);

-- Policies for admin_users
CREATE POLICY "Only admins can manage admin_users"
  ON admin_users FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admin_users));
```

### Step 4: Set Environment Variables

Update `.env.local` in the root of your project:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anonymous_key
```

Get these values from **Supabase Dashboard → Project Settings → API**

### Step 5: Create Admin User (You!)

1. Go to **Supabase → Authentication → Users**
2. Click "Add user" and create your account with email/password
3. Copy the user ID (UUID)
4. Go to **SQL Editor** and run:

```sql
INSERT INTO admin_users (user_id) VALUES ('your-user-id-here');
```

### Step 6: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000`:
- Should redirect to login
- Create account or log in with your credentials
- Should see dashboard with products (once you add them in admin panel)
- Click Admin button to add products, purchases, and view sales

---

## 📦 Adding Your First Product

1. Log in with your account
2. Click "Admin" button
3. Go to "Produkter" tab
4. Fill in:
   - Produktnavn: `Cola`
   - Innkjøpspris: `5`
   - Salgspris: `10`
   - Startlager: `50`
5. Click "Legg til produkt"
6. Go back to Dashboard - you should see Cola with quick-sell button!

---

## 🚢 Deploy to Vercel

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Brus app"
   git branch -M main
   git remote add origin https://github.com/yourusername/brusapp.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and connect your GitHub repo

3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Click Deploy!

---

## ✨ Features

### Dashboard (`/dashboard`)
- ✅ Total profit display
- ✅ Real-time inventory
- ✅ "Solgt 1" (Sold 1) quick-sell buttons
- ✅ Auto-updates stock & profit
- ✅ Mobile-optimized large buttons

### Admin Panel (`/admin`)
- ✅ Add new products
- ✅ Register purchases (increase stock)
- ✅ View sales log
- ✅ Real-time product list

### Security
- ✅ Supabase Auth (email + password)
- ✅ Row Level Security (RLS)
- ✅ Admin role checking
- ✅ Protected routes

---

## 🔄 How It Works

1. **Register Sale**: Click "Solgt 1" button
   - Stock decreases by 1
   - Profit recorded: `(sell_price - buy_price) × quantity`
   - Total profit updated in real-time

2. **Register Purchase**: Admin adds purchase
   - Stock increases
   - Purchase logged for history

3. **Real-time Updates**: Dashboard refreshes automatically when:
   - Products are added
   - Sales are recorded
   - Stock changes

---

## 🆘 Troubleshooting

### "Login page keeps showing"
- Check if account exists in Supabase Auth
- Verify `.env.local` has correct credentials
- Refresh the page

### "Admin button doesn't appear"
- Verify user_id in `admin_users` table matches your user
- Run: `SELECT current_user_id();` in SQL to verify user ID

### "Can't add products"
- Check you're logged in as admin
- Verify RLS policies are applied
- Check browser console for error messages

### Environment variables not working
- Restart `npm run dev`
- Check `.env.local` is in root directory (same level as `package.json`)

---

## 📚 Next Steps (Future Enhancements)

- 📊 Daily/weekly sales graphs
- 📤 CSV export
- 🔔 Low stock alerts
- 📱 PWA (offline support)
- 🎫 QR code link
- 🌙 Dark mode

---

## 📞 Quick Reference

| Page | URL | Purpose |
|------|-----|---------|
| Login | `/login` | Email/password auth |
| Dashboard | `/dashboard` | Main sales interface |
| Admin | `/admin` | Manage products & view logs |

---

## 💡 Tips

- **Mobile First**: App is optimized for phone. Test on mobile!
- **Quick Sales**: Goal is 1-2 clicks to record a sale
- **No POS System**: This is internal-only, not a payment system
- **Free Forever**: Supabase free tier + Vercel free tier = $0/month

---

Good luck! 🚀
