'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ThemeToggle } from './ThemeToggle';

const Header = () => {
  return (
    <header className="p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Highest Voice</h1>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <ConnectButton />
      </div>
    </header>
  );
};

export default Header;
