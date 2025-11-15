'use client';

import { Bell, Wallet } from 'lucide-react';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface MobileHeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
}

export function MobileHeader({ 
  title = "HighestVoice",
  showSearch = true,
  showNotifications = true,
  notificationCount = 0
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 md:hidden">
      {/* Background blur */}
      <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-xl border-b border-white/10" />
      
      {/* Header content */}
      <div className="relative flex items-center justify-between px-4 py-3 safe-area-pt">
        {/* Left side - Logo & Title */}
        <div className="flex-1 flex items-center space-x-2">
          <Image
            src="/logo-white.png"
            alt="HighestVoice Logo"
            width={28}
            height={28}
            className="object-contain"
          />
          <h1 className="text-lg font-semibold text-white truncate">
            {title}
          </h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-1">
          {/* Connect Wallet Button */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
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
                  {!connected ? (
                    <Button
                      onClick={openConnectModal}
                      variant="ghost"
                      size="sm"
                      className="p-2 text-primary-400 hover:text-primary-300"
                      title="Connect Wallet"
                    >
                      <Wallet className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={openAccountModal}
                      variant="ghost"
                      size="sm"
                      className="p-2 text-green-400 hover:text-green-300"
                      title="Wallet Connected"
                    >
                      <Wallet className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
          
          {showNotifications && (
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-gray-400 hover:text-white"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge 
                  variant="error" 
                  size="sm"
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
