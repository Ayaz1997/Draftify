
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from Geist
import './globals.css';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";

// Changed from geistSans and geistMono
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'My Biz Docs - Your Document Automation Tool',
  description: 'Create professional documents like work orders, letterheads, and invoices with ease using My Biz Docs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased flex flex-col min-h-screen`} // Changed font variable
        suppressHydrationWarning={true}
      >
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
