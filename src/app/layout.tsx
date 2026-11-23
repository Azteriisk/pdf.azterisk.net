import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Azterisk PDF Studio | Merge, Split, Rearrange & Edit PDFs',
  description:
    'Free, private, 100% client-side PDF workflow. Merge multiple files, split pages, reorder visually, remove pages, annotate, sign, and edit PDFs without signup or fees.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-[#1d2021] text-[#ebdbb2] antialiased selection:bg-[#fe8019] selection:text-[#1d2021]">
        {children}
      </body>
    </html>
  );
}
