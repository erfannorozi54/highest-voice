'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useAccessibility } from '@/app/accessibility-provider';

export default function AccessibilityControls() {
  const { 
    prefersReducedMotion, 
    colorBlindMode, 
    highContrast, 
    fontSize,
    updatePrefersReducedMotion,
    updateColorBlindMode,
    updateHighContrast,
    updateFontSize
  } = useAccessibility();
  
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-[var(--color-background-secondary)] border border-[var(--color-border)] rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className="w-5 h-5 text-[var(--color-text-primary)]" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 p-4 bg-[var(--color-background-secondary)] border border-[var(--color-border)] rounded-lg shadow-xl min-w-[280px]"
          >
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              Accessibility Settings
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Reduced Motion
                </span>
                <button
                  onClick={() => updatePrefersReducedMotion(!prefersReducedMotion)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    prefersReducedMotion 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {prefersReducedMotion ? 'On' : 'Off'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  High Contrast
                </span>
                <button
                  onClick={() => updateHighContrast(!highContrast)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    highContrast 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {highContrast ? 'On' : 'Off'}
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Color Blind Mode
                </span>
                <select 
                  onChange={(e) => updateColorBlindMode(e.target.value as 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia')}
                  className="w-full px-2 py-1 text-xs bg-[var(--color-background-tertiary)] border border-[var(--color-border)] rounded"
                  value={colorBlindMode}
                >
                  <option value="none">None</option>
                  <option value="protanopia">Protanopia</option>
                  <option value="deuteranopia">Deuteranopia</option>
                  <option value="tritanopia">Tritanopia</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Font Size
                </span>
                <select 
                  onChange={(e) => updateFontSize(e.target.value as 'normal' | 'large' | 'extra-large')}
                  className="w-full px-2 py-1 text-xs bg-[var(--color-background-tertiary)] border border-[var(--color-border)] rounded"
                  value={fontSize}
                >
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
