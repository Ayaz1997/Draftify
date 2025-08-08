
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from Geist
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from "@/components/ui/toaster";

// Changed from geistSans and geistMono
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'My Biz Docs - Your Business Documentation Tool',
  description: 'Create professional documents like work orders, letterheads, and invoices with ease.',
  manifest: "/manifest.json",
   themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  openGraph: {
    title: 'My Biz Docs - Your Business Documentation Tool',
    description: 'Create professional documents like work orders, letterheads, and invoices with ease.',
    images: [
      {
        url: 'https://my-business-doc.vercel.app/mbd-og-img.jpg', // Updated image URL
        width: 1200,
        height: 630,
        alt: 'My Biz Docs - Document Creation Tool',
      },
    ],
    type: 'website',
  },
  twitter: { // Optional: Add Twitter specific card metadata
    card: 'summary_large_image',
    title: 'My Biz Docs - Your Business Documentation Tool',
    description: 'Create professional documents like work orders, letterheads, and invoices with ease.',
    images: ['https://my-business-doc.vercel.app/mbd-og-img.jpg'], // Updated image URL
  },
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
        <main className="flex-grow container mx-auto px-4 py-8 pb-32 lg:pb-16">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
