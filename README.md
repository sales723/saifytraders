# Saify Traders P&L Tracker

A Next.js profit and loss tracking application built for deployment on Vercel with Supabase as the database and Google authentication.

## Setup

1. Create a Supabase project at https://app.supabase.com.
2. In your project, open `Settings > API` and copy the `Project URL` and `anon public` key.
3. Open `Authentication > Providers` and enable `Google`.
4. Add `http://localhost:3000` under `Redirect URLs` for local development.
5. Add environment variables to `.env.local`:

   - `NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key`

6. Use `supabase/schema.sql` in Supabase SQL Editor or run the SQL there to create the `transactions` table.

## Database schema

Use `supabase/schema.sql` to create the table:

```sql
CREATE TABLE transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  type text NOT NULL CHECK (type IN ('profit', 'loss')),
  amount numeric NOT NULL,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON transactions (user_id);
```

## Local development

```bash
npm install
npm run dev
```

## Vercel deployment

1. Push this repository to GitHub.
2. Import it into Vercel.
3. Add environment variables in the Vercel dashboard.
4. Deploy.

## Notes

- The app uses Supabase client-side auth with Google OAuth.
- The `app/page.tsx` component stores transactions scoped to the authenticated user.
