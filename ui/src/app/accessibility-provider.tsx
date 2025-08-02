'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilityContextType {
  prefersReducedMotion: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  updatePrefersReducedMotion: (value: boolean) => void;
  updateColorBlindMode: (value: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => void;
  updateHighContrast: (value: boolean) => void;
  updateFontSize: (value: 'normal' | 'large' | 'extra-large') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  prefersReducedMotion: false,
  colorBlindMode: 'none',
  highContrast: false,
  fontSize: 'normal',
  updatePrefersReducedMotion: () => {},
  updateColorBlindMode: () => {},
  updateHighContrast: () => {},
  updateFontSize: () => {},
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none');
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');

  // Functions to update accessibility settings
  const updatePrefersReducedMotion = (value: boolean) => {
    setPrefersReducedMotion(value);
  };

  const updateColorBlindMode = (value: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => {
    setColorBlindMode(value);
  };

  const updateHighContrast = (value: boolean) => {
    setHighContrast(value);
  };

  const updateFontSize = (value: 'normal' | 'large' | 'extra-large') => {
    setFontSize(value);
  };

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply accessibility settings to document
    const root = document.documentElement;
    
    if (prefersReducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    }

    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (colorBlindMode !== 'none') {
      root.classList.add(colorBlindMode);
    }

    root.classList.remove('font-large', 'font-extra-large');
    if (fontSize !== 'normal') {
      root.classList.add(`font-${fontSize}`);
    }
  }, [prefersReducedMotion, colorBlindMode, highContrast, fontSize]);

  return (
    <AccessibilityContext.Provider value={{
      prefersReducedMotion,
      colorBlindMode,
      highContrast,
      fontSize,
      updatePrefersReducedMotion,
      updateColorBlindMode,
      updateHighContrast,
      updateFontSize,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
