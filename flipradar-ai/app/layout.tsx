import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'FlipRadar AI – Arbitrage & Deal Dashboard',
  description: 'Real-time arbitrage deal radar for hardware and gear resellers. Find profitable flips with AI-powered confidence scoring.',
  keywords: 'arbitrage, reseller, deal finder, GPU deals, flip profit, ROI tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <NavBar />
        <main style={{ paddingTop: '64px', minHeight: '100vh' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
