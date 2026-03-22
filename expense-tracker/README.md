# SmartXpense 💰

A full-stack expense tracking web app with analytics, budgeting, savings goals, and AI-powered insights.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Cache | Upstash Redis |
| Auth | JWT + bcryptjs |
| Email | Resend API + React Email |
| Files | Cloudinary |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- An [Upstash](https://upstash.com) Redis database
- A [Cloudinary](https://cloudinary.com) account
- A [Resend](https://resend.com) account

### 1. Clone and install

```bash
# Install backend dependencies
cd expense-tracker/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
# From the expense-tracker/ root
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Edit both `.env` files with your actual credentials.

### 3. Set up the database

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Run development servers

```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- 🔐 **JWT Authentication** with Redis session storage (7-day TTL)
- 💸 **Expense Tracking** with categories, payment methods, and receipts
- 📊 **Analytics Dashboard** with 6 chart types (line, bar, donut, pie, heatmap)
- 💰 **Budget Management** with real-time progress and over-budget alerts
- 🎯 **Savings Goals** with progress tracking
- 📧 **Month-End Email Reports** via Resend (auto-scheduled + manual trigger)
- 🌙 **Dark/Light Mode** with localStorage persistence
- 📱 **Fully Responsive** mobile-first design
- 🔄 **Redis Caching** on dashboard (60s TTL, invalidated on changes)
- ☁️ **Cloudinary** for profile photos and receipt images

## API Documentation

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout (clears Redis session)

### Expenses
- `GET /api/expenses` — List (paginated, filterable)
- `POST /api/expenses` — Create
- `PUT /api/expenses/:id` — Update
- `DELETE /api/expenses/:id` — Delete
- `GET /api/expenses/export/csv` — Export as CSV

### Analytics
- `GET /api/analytics/summary` — Dashboard summary stats
- `GET /api/analytics/monthly` — Monthly trend (12 months)
- `GET /api/analytics/categories` — Category breakdown
- `GET /api/analytics/merchants` — Top merchants
- `GET /api/analytics/dayofweek` — Day-of-week spending

### Budgets
- `GET/POST /api/budgets` — List / Create
- `PUT/DELETE /api/budgets/:id` — Update / Delete

### Savings
- `GET/POST /api/savings` — List / Create
- `PUT/DELETE /api/savings/:id` — Update / Delete

### User
- `GET/PUT /api/user/profile` — Get / Update profile (with photo upload)

### Email
- `POST /api/email/test-report` — Manually trigger month-end report

## Environment Variables

See `.env.example` for a full list of required environment variables.

## Deployment

- **Backend**: Deploy to Railway, Render, or any Node.js host
- **Frontend**: Deploy to Vercel (`next build`)
- **Database**: Neon PostgreSQL (serverless)
- **Cache**: Upstash Redis (serverless)
