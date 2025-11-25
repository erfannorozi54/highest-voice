'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Zap, Trophy, Users, Wallet, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onCreatePost?: () => void;
}

export function MobileBottomNav({ 
  activeTab, 
  onTabChange,
  onCreatePost 
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTabClick = (tab: string, href?: string, disabled?: boolean) => {
    if (disabled) return;
    if (href) {
      window.location.href = href;
    }
    onTabChange?.(tab);
  };

  const tabs = [
    { id: 'home', icon: Zap, label: 'Auction', href: '/' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
    { id: 'create', icon: Plus, label: 'Bid', isCreate: true },
    { id: 'nft', icon: Users, label: 'NFTs', href: '/nft' },
    { 
      id: 'profile', 
      icon: Wallet, 
      label: 'Profile', 
      href: mounted && isConnected && address ? `/profile/${address}` : '#',
      disabled: !mounted || !isConnected 
    },
  ];

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (activeTab) return activeTab;
    
    const currentTab = tabs.find(tab => {
      if (!tab.href) return false;
      if (tab.href === '/') return pathname === '/';
      return pathname.startsWith(tab.href);
    });
    
    return currentTab?.id || 'home';
  };

  const active = getActiveTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background blur */}
      <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-xl border-t border-white/10" />
      
      {/* Navigation */}
      <nav className="relative mx-auto max-w-md flex items-center gap-1 px-2 py-2 safe-area-pb">
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
                  handleTabClick(tab.id, tab.href, tab.disabled);
                }
              }}
              disabled={tab.disabled && !isCreate}
              title={mounted && tab.disabled ? 'Connect wallet to view profile' : undefined}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all duration-200 min-h-[52px]',
                tab.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : isCreate
                  ? 'bg-primary-600 hover:bg-primary-700 shadow-[0_0_18px_rgba(37,99,235,0.6)]'
                  : isActive
                  ? 'bg-primary-500/15 border border-primary-500/40 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                  : 'hover:bg-white/5'
              )}
            >
              {isActive && !isCreate && !tab.disabled && (
                <div className="absolute top-1 w-1 h-1 bg-primary-400 rounded-full" />
              )}
              <Icon 
                className={cn(
                  'w-5 h-5 mb-1',
                  tab.disabled
                    ? 'text-gray-600'
                    : isCreate
                    ? 'text-white'
                    : isActive
                    ? 'text-primary-400'
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
