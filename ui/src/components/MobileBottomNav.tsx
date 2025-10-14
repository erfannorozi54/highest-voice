'use client';

import { useState } from 'react';
import { Home, Trophy, Users, User, Plus } from 'lucide-react';
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

  const handleTabClick = (tab: string) => {
    setActive(tab);
    onTabChange?.(tab);
  };

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'leaderboard', icon: Trophy, label: 'Winners' },
    { id: 'create', icon: Plus, label: 'Create', isCreate: true },
    { id: 'explore', icon: Users, label: 'Explore' },
    { id: 'profile', icon: User, label: 'Profile' },
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
                  handleTabClick(tab.id);
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
