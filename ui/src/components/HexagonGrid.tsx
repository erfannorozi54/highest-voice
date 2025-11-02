'use client';

import { motion } from 'framer-motion';

export function HexagonGrid() {
  const hexagons = Array.from({ length: 30 }, (_, i) => i);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px),
          linear-gradient(rgba(176, 38, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }}>
        {hexagons.map((i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${(i % 6) * 20}%`,
              top: `${Math.floor(i / 6) * 20}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          >
            <svg width="100" height="100" viewBox="0 0 100 100">
              <polygon
                points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
                fill="none"
                stroke="url(#hexGradient)"
                strokeWidth="1.5"
              />
              <defs>
                <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#b026ff" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
