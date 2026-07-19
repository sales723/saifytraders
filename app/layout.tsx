import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saify Traders P&L Tracker',
  description: 'Profit and loss statement tracking with Supabase and Google auth.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
