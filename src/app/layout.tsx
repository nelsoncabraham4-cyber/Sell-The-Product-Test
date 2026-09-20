import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import { FreezeDiagnostic } from '@/components/freeze-diagnostic';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sell The Product',
  description: 'Sell products and compete on the leaderboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <FreezeDiagnostic />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}


