import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Telegram WebApp Verification',
  description: 'KYC via Telegram + Supabase',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        {children}
      </body>
    </html>
  );
}
