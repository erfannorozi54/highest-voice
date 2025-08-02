'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v1m0 16v1m8.4-15.4-1 1M6.6 18.4l-1 1M21 12h-1M4 12H3m15.4 8.4-1-1M5.6 5.6l-1-1"/></svg>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
