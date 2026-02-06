# 🥤 Brus Lager & Salg - Mobile App

A free, fast, mobile-first warehouse and sales app for sports clubs selling soft drinks internally.

## Features

- 📱 **Mobile First** - Optimized for phone use
- ⚡ **Lightning Fast** - Register a sale in 1-2 clicks
- 💰 **Real-time Profit Tracking** - Instant profit calculations
- 📊 **Inventory Management** - See stock levels at a glance
- 🔐 **Secure** - Supabase auth with RLS policies
- 💯 **Free Forever** - Next.js + Supabase + Vercel free tier

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, React Compiler)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel (free)

## Quick Start

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Set Environment Variables** (see [SETUP_GUIDE.md](SETUP_GUIDE.md))
   ```bash
   # Create .env.local with:
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Login | `/login` | Email/password authentication |
| Dashboard | `/dashboard` | Main sales interface + inventory |
| Admin | `/admin` | Product management & sales logs |

## Database Schema

### products
- `id` (uuid)
- `name` (text)
- `buy_price` (numeric)
- `sell_price` (numeric)
- `stock` (integer)
- `created_at` (timestamp)

### sales
- `id` (uuid)
- `product_id` (uuid)
- `quantity` (integer)
- `profit` (numeric)
- `created_at` (timestamp)

### purchases (optional history)
- `id` (uuid)
- `product_id` (uuid)
- `quantity` (integer)
- `price_per_unit` (numeric)
- `created_at` (timestamp)

### admin_users
- `id` (uuid)
- `user_id` (uuid)
- `created_at` (timestamp)

## Setup Instructions

**⚠️ READ [SETUP_GUIDE.md](SETUP_GUIDE.md) FOR COMPLETE SETUP**

The app requires Supabase setup before it works:
1. Create Supabase project
2. Run SQL scripts to create tables
3. Set up RLS policies
4. Add environment variables
5. Create admin user

## Deployment

Deploy to Vercel with one click:

1. Push to GitHub
2. Connect repo on [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy!

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed deployment steps.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with AuthProvider
│   ├── page.tsx            # Redirect to login/dashboard
│   ├── login/
│   │   └── page.tsx        # Login page
│   ├── dashboard/
│   │   └── page.tsx        # Main sales interface
│   ├── admin/
│   │   └── page.tsx        # Admin panel
│   └── globals.css         # Tailwind styles
├── lib/
│   └── supabase.ts         # Supabase client
├── context/
│   └── AuthContext.tsx     # Auth state management
└── .env.local              # Environment variables
```

## Performance

- ✅ Mobile-optimized
- ✅ Real-time updates with Supabase subscriptions
- ✅ Minimal JavaScript (Next.js optimizations)
- ✅ Tailwind CSS for fast styling
- ✅ Fast load times on slow networks

## Security

- 🔒 Email + password authentication
- 🔒 Supabase Row Level Security (RLS)
- 🔒 Admin role checking
- 🔒 Protected routes with auth guards

## Limitations

- ❌ No payment processing (internal sales only)
- ❌ No POS system features
- ❌ No receipts
- ❌ No advanced reporting (yet)

## Future Ideas

- 📊 Daily/weekly sales graphs
- 📤 CSV export
- 🔔 Low stock alerts
- 📱 PWA for offline support
- 🎫 QR code linking

## License

Free for educational and non-profit use.

## Support

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for troubleshooting.

