import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'HighestVoice - Decentralized Voice Auction',
  description: 'Permissionless, second-price sealed-bid auction for projecting the loudest voice on-chain. Win NFTs, earn rewards, and make your voice heard in the decentralized world.',
  keywords: ['blockchain', 'ethereum', 'auction', 'nft', 'defi', 'web3', 'decentralized'],
  authors: [{ name: 'Erfan Norozi', url: 'https://github.com/erfannorozi54' }],
  creator: 'Erfan Norozi',
  publisher: 'HighestVoice Protocol',
  icons: {
    icon: [
      { url: '/logo-black.png', media: '(prefers-color-scheme: light)' },
      { url: '/logo-white.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/logo-black.png',
  },
  openGraph: {
    title: 'HighestVoice - Decentralized Voice Auction',
    description: 'Win the auction, get your voice heard, earn NFT rewards',
    type: 'website',
    locale: 'en_US',
    images: ['/logo-black.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HighestVoice - Decentralized Voice Auction',
    description: 'Win the auction, get your voice heard, earn NFT rewards',
    images: ['/logo-black.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body 
        className="min-h-screen bg-dark-950 text-white antialiased font-sans"
        suppressHydrationWarning={true}
      >
        <Providers>
          <ErrorBoundary>
            <div className="relative min-h-screen">
              {/* Background Effects */}
              <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
                <div className="absolute inset-0 cyber-grid opacity-30" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl animate-pulse-slow" />
              </div>
              
              {children}
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
