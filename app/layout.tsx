import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Food Cafe - Premium Dine-in Experience",
  description: "Seamless QR ordering for modern restaurants.",
};

import { Toaster } from "@/components/ui/sonner";
import { WelcomeDialog } from "@/components/features/auth/welcome-dialog";

// ...

import { Suspense } from "react";

// ...

import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        {children}
        <Suspense fallback={null}>
          <WelcomeDialog />
        </Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
