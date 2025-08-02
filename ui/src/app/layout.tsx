import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/color-tokens.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ThemeProvider } from './theme-provider';
import { AccessibilityProvider } from './accessibility-provider';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Highest Voice',
  description: 'The decentralized sound competition.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'bg-background text-foreground')} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AccessibilityProvider>
            <Providers>{children}</Providers>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


