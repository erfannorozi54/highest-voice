'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { Menu, X, Zap, Trophy, Users, Wallet, Settings } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn } from '@/lib/utils';
import { NETWORKS } from '@/lib/wagmi';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const currentNetwork = Object.values(NETWORKS).find(network => network.chainId === chainId);

  const navigation = [
    { name: 'Auction', href: '/', icon: Zap },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'NFTs', href: '/nfts', icon: Users },
    { name: 'Portfolio', href: '/portfolio', icon: Wallet },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'sticky top-0 z-40 w-full border-b border-white/10 glass backdrop-blur-xl',
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/logo-white.png"
                  alt="HighestVoice Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text font-display">
                HighestVoice
              </h1>
              <p className="text-xs text-gray-400 -mt-1">
                Decentralized Auction
              </p>
            </div>
          </motion.a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </motion.a>
            ))}
          </nav>

          {/* Network Badge & Connect Button */}
          <div className="flex items-center space-x-3">
            {/* Network Status */}
            {isConnected && currentNetwork && (
              <Badge
                variant={chainId === 1 ? 'success' : chainId === 11155111 ? 'warning' : 'primary'}
                size="sm"
                className="hidden sm:flex"
              >
                {currentNetwork.name}
              </Badge>
            )}

            {/* Connect Button */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <Button
                            onClick={openConnectModal}
                            variant="cyber"
                            size="md"
                            glow
                          >
                            Connect Wallet
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                            onClick={openChainModal}
                            variant="outline"
                            size="md"
                            className="border-red-500/50 text-red-400"
                          >
                            Wrong Network
                          </Button>
                        );
                      }

                      return (
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={openChainModal}
                            variant="ghost"
                            size="sm"
                            className="hidden sm:flex"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 16,
                                  height: 16,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 8,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 16, height: 16 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </Button>

                          <Button
                            onClick={openAccountModal}
                            variant="outline"
                            size="md"
                            className="font-mono"
                          >
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ''}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-white/10"
          >
            <div className="space-y-2">
              {/* Connect Wallet Button - Mobile */}
              <div className="px-4 pb-3 border-b border-white/10">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    authenticationStatus,
                    mounted,
                  }) => {
                    const ready = mounted && authenticationStatus !== 'loading';
                    const connected =
                      ready &&
                      account &&
                      chain &&
                      (!authenticationStatus ||
                        authenticationStatus === 'authenticated');

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          'style': {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <Button
                                onClick={openConnectModal}
                                variant="cyber"
                                size="md"
                                className="w-full"
                                glow
                              >
                                Connect Wallet
                              </Button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <Button
                                onClick={openChainModal}
                                variant="outline"
                                size="md"
                                className="w-full border-red-500/50 text-red-400"
                              >
                                Wrong Network
                              </Button>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              <Button
                                onClick={openChainModal}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                              >
                                {chain.hasIcon && (
                                  <div
                                    style={{
                                      background: chain.iconBackground,
                                      width: 16,
                                      height: 16,
                                      borderRadius: 999,
                                      overflow: 'hidden',
                                      marginRight: 8,
                                    }}
                                  >
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        style={{ width: 16, height: 16 }}
                                      />
                                    )}
                                  </div>
                                )}
                                {chain.name}
                              </Button>

                              <Button
                                onClick={openAccountModal}
                                variant="outline"
                                size="md"
                                className="w-full font-mono"
                              >
                                {account.displayName}
                                {account.displayBalance
                                  ? ` (${account.displayBalance})`
                                  : ''}
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </div>
    </motion.header>
  );
};

export { Header };
