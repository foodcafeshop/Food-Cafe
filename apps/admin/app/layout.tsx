
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Food Cafe | Super Admin',
    description: 'Global Platform Management',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <div className="min-h-screen bg-background text-foreground">
                    {children}
                </div>
                <Toaster theme="dark" position="top-right" />
            </body>
        </html>
    );
}
