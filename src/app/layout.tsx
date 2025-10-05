import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Memory Garden",
  description: "Tend digital seeds through mindful care and reflection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[hsl(110_45%_96%)] text-emerald-950`}>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-emerald-100 to-emerald-200/70">
          <header className="mx-auto flex max-w-6xl flex-col gap-2 px-6 pb-6 pt-10 text-emerald-900 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">?? The Memory Garden</h1>
              <p className="text-sm text-emerald-800/80">Nurture ideas, dreams, and recipes by tending to them intentionally.</p>
            </div>
            <span className="text-xs font-medium uppercase tracking-widest text-emerald-600/80">Growth only happens through care</span>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}

