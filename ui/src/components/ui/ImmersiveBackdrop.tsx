'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Particle {
  id: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface ImmersiveBackdropProps {
  imageUrl?: string;
  className?: string;
  parallaxStrength?: number;
}

export default function ImmersiveBackdrop({
  imageUrl,
  className = '',
  parallaxStrength = 0.5,
}: ImmersiveBackdropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  
  const [colorPalette, setColorPalette] = useState<ColorPalette>({
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    background: '#0f172a',
  });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 100, damping: 30 });
  
  const parallaxX = useTransform(smoothMouseX, [0, 1], [-parallaxStrength, parallaxStrength]);
  const parallaxY = useTransform(smoothMouseY, [0, 1], [-parallaxStrength, parallaxStrength]);

  // Generate deterministic particles based on image URL
  const generateParticles = useCallback((seed: string): Particle[] => {
    const particles: Particle[] = [];
    const seedValue = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 0; i < 50; i++) {
      const random = Math.sin(seedValue + i) * 10000;
      particles.push({
        id: i,
        left: `${Math.round(((random * 100) % 100) * 1000) / 1000}%`,
        top: `${Math.round(((random * 1000) % 100) * 1000) / 1000}%`,
        animationDelay: `${Math.round(((random * 5) % 5) * 100) / 100}s`,
        animationDuration: `${Math.round((3 + (random * 4) % 4) * 100) / 100}s`,
      });
    }
    return particles;
  }, []);

  const particles = useMemo(() => 
    generateParticles(imageUrl || 'default-seed'), 
    [generateParticles, imageUrl]
  );

  useEffect(() => {
    // Create WebWorker for color palette extraction
    if (typeof window !== 'undefined') {
      const workerCode = `
        self.onmessage = function(e) {
          const { imageUrl } = e.data;
          
          // Simulate color palette extraction
          // In production, this would use canvas image analysis
          const colors = {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            accent: '#ec4899',
            background: '#0f172a',
          };
          
          self.postMessage({ colors });
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      workerRef.current = new Worker(workerUrl);
      
      workerRef.current.onmessage = (e) => {
        setColorPalette(e.data.colors);
      };
      
      if (imageUrl) {
        workerRef.current.postMessage({ imageUrl });
      }
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma && e.beta) {
        const x = (e.gamma + 90) / 180;
        const y = (e.beta + 90) / 180;
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [mouseX, mouseY]);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-[-1] overflow-hidden ${className}`}
      style={{
        '--primary': colorPalette.primary,
        '--secondary': colorPalette.secondary,
        '--accent': colorPalette.accent,
        '--background': colorPalette.background,
      } as React.CSSProperties}
    >
      {/* Animated gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[var(--primary)]/20 to-[var(--accent)]/30" />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full bg-[var(--accent)]/30 animate-pulse"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration,
            }}
          />
        ))}
      </div>
      
      {/* Parallax layers */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          transform: `translate(${parallaxX.get()}px, ${parallaxY.get()}px)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-[var(--secondary)]/10 to-transparent" />
      </div>
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay">
        <svg width="100%" height="100%">
          <filter id="noise">
            <feTurbulence baseFrequency="0.9" numOctaves="4" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>
    </div>
  );
}
