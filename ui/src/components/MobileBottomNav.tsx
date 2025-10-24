'use client';

import { useState } from 'react';
import { Zap, Trophy, Users, Wallet, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onCreatePost?: () => void;
}

export function MobileBottomNav({ 
  activeTab = 'home', 
  onTabChange,
  onCreatePost 
}: MobileBottomNavProps) {
  const [active, setActive] = useState(activeTab);

  const handleTabClick = (tab: string, href?: string) => {
    setActive(tab);
    if (href) {
      window.location.href = href;
    }
    onTabChange?.(tab);
  };

  const tabs = [
    { id: 'home', icon: Zap, label: 'Auction', href: '/' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
    { id: 'create', icon: Plus, label: 'Bid', isCreate: true },
    { id: 'nfts', icon: Users, label: 'NFTs', href: '/nfts' },
    { id: 'portfolio', icon: Wallet, label: 'Portfolio', href: '/portfolio' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background blur */}
      <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-xl border-t border-white/10" />
      
      {/* Navigation */}
      <nav className="relative flex items-center justify-around px-2 py-2 safe-area-pb">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          const isCreate = tab.isCreate;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isCreate) {
                  onCreatePost?.();
                } else {
                  handleTabClick(tab.id, tab.href);
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200',
                isCreate
                  ? 'bg-primary-600 hover:bg-primary-700 scale-110'
                  : isActive
                  ? 'bg-white/10'
                  : 'hover:bg-white/5'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 mb-1',
                  isCreate
                    ? 'text-white'
                    : isActive
                    ? 'text-white'
                    : 'text-gray-400'
                )} 
              />
              <span 
                className={cn(
                  'text-xs font-medium',
                  isCreate
                    ? 'text-white'
                    : isActive
                    ? 'text-white'
                    : 'text-gray-500'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
