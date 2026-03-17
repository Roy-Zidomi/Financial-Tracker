# Personal Finance Tracker

Fullstack finance tracker built with Next.js, Prisma, Auth.js, and PostgreSQL.

## Features

- Email/password authentication
- Transactions CRUD API with filters
- Category management
- Budget management with warning levels
- Savings goals tracking
- Dashboard summary + charts
- PDF export and CSV import APIs

## Tech Stack

- Next.js (App Router, TypeScript)
- Prisma ORM + PostgreSQL
- Auth.js (NextAuth v5 Credentials)
- Recharts
- Zod + React Hook Form

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` and `NEXTAUTH_SECRET` in `.env`.

4. Generate Prisma client and push schema:

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

5. Start development server:

```bash
npm run dev
```

## API Endpoints

- `POST /api/auth/register`
- `GET/POST /api/transactions`
- `PUT/DELETE /api/transactions/:id`
- `GET/POST /api/categories`
- `PUT/DELETE /api/categories/:id`
- `GET/POST /api/budgets`
- `PUT/DELETE /api/budgets/:id`
- `GET/POST /api/savings`
- `PUT/DELETE /api/savings/:id`
- `GET /api/export/pdf`
- `POST /api/import/csv`
