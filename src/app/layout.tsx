import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Delta — Carbon Footprint Coach',
    template: '%s · Delta',
  },
  description:
    'Delta is a decision tool, not a calculator. Log your life in seconds, find your single highest-leverage change, and see every number sourced.',
  applicationName: 'Delta',
  authors: [{ name: 'Delta' }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0f4c45',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Reading a request header opts the tree into dynamic rendering, which is what
  // lets the middleware's per-request CSP nonce be applied to Next's scripts.
  await headers();

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
