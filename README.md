# 🌱 Sprout — Expense Tracker

A full-stack expense tracker built with **Next.js 14**, **MongoDB Atlas**, **NextAuth.js**, and deployed on **Vercel**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Database | MongoDB Atlas |
| Authentication | NextAuth.js + JWT + bcrypt |
| Validation | Zod |
| Charts | Recharts |
| Deployment | Vercel |

---

## Features

- ✅ Register / Login with hashed passwords (bcrypt)
- ✅ JWT session via NextAuth.js
- ✅ Dashboard with budget overview & insights
- ✅ Full CRUD for Transactions (with pagination & filters)
- ✅ Budget management per category with alerts
- ✅ Analytics with Recharts (Donut, Line charts)
- ✅ CSV export for reports
- ✅ Admin panel (user management, role control)
- ✅ Route protection via middleware
- ✅ Input validation with Zod
- ✅ Multi-currency support

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   └── register/route.ts        # Registration endpoint
│   │   ├── transactions/
│   │   │   ├── route.ts                 # GET list, POST create
│   │   │   └── [id]/route.ts            # GET, PUT, DELETE single
│   │   ├── budgets/
│   │   │   ├── route.ts                 # GET list, POST create
│   │   │   └── [id]/route.ts            # PUT, DELETE single
│   │   ├── analytics/route.ts           # Dashboard stats
│   │   ├── reports/route.ts             # CSV export
│   │   ├── profile/route.ts             # Profile + password
│   │   └── admin/users/route.ts         # Admin user management
│   ├── dashboard/page.tsx
│   ├── transactions/page.tsx
│   ├── budgets/page.tsx
│   ├── analytics/page.tsx
│   ├── reports/page.tsx
│   ├── profile/page.tsx
│   ├── admin/page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── page.tsx                         # Landing page
│   ├── layout.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── AppShell.tsx
│   ├── ui/
│   │   ├── StatCard.tsx
│   │   └── Modal.tsx
│   ├── forms/
│   │   └── TransactionForm.tsx
│   └── charts/
│       ├── SpendingDonut.tsx
│       └── TrendLine.tsx
├── lib/
│   ├── mongodb.ts                       # DB connection (cached for serverless)
│   ├── auth.ts                          # NextAuth config
│   ├── utils.ts                         # Helpers, formatters
│   └── validations.ts                   # Zod schemas
├── models/
│   ├── User.ts
│   ├── Transaction.ts
│   ├── Budget.ts
│   ├── Notification.ts
│   └── AuditLog.ts
├── hooks/
│   └── useFetch.ts
├── types/
│   └── index.ts
└── middleware.ts                        # Route protection
```

---

## Local Development

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/sprout-expense-tracker.git
cd sprout-expense-tracker
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/sprout?retryWrites=true&w=majority
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Generate a secret:**
```bash
openssl rand -base64 32
```

### 3. Set Up MongoDB Atlas (Free)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free **M0 cluster**
3. Create a **database user** (username + password)
4. In **Network Access**, click **Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`) — required for Vercel
5. In **Database → Connect → Drivers**, copy your connection string
6. Replace `<password>` in the connection string with your DB user password
7. Paste it as `MONGODB_URI` in `.env.local`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sprout-expense-tracker.git
git push -u origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Click **Import** next to your GitHub repo
4. Keep all defaults (Next.js is auto-detected)
5. Click **Environment Variables** and add:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your full Atlas connection string |
| `NEXTAUTH_SECRET` | Your generated secret (32+ chars) |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` |

> ⚠️ Set `NEXTAUTH_URL` to your **actual Vercel URL** after first deploy. You can find it in the Vercel dashboard.

6. Click **Deploy**

### Step 3 — Fix NEXTAUTH_URL (if needed)

After Vercel assigns your URL:
1. Go to **Project Settings → Environment Variables**
2. Update `NEXTAUTH_URL` to match your deployment URL exactly
3. Click **Redeploy**

---

## Creating an Admin User

There is no admin UI for first setup. After registering normally, update your user role directly in MongoDB Atlas:

1. Go to **MongoDB Atlas → Browse Collections → sprout → users**
2. Find your user document
3. Click **Edit** and change `"role": "user"` to `"role": "admin"`
4. Save — you'll now see the Admin Panel in the sidebar

---


