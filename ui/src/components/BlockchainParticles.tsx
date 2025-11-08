'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

export function BlockchainParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Color palette - vibrant blockchain colors
    const colors = [
      { rgb: '0, 212, 255', hue: 190 },      // Bright cyan
      { rgb: '138, 43, 226', hue: 270 },     // Blue violet
      { rgb: '147, 51, 234', hue: 280 },     // Purple
      { rgb: '59, 130, 246', hue: 217 },     // Blue
      { rgb: '16, 185, 129', hue: 160 },     // Emerald
      { rgb: '236, 72, 153', hue: 330 },     // Pink
    ];

    // Initialize particles with varied sizes and colors
    const particleCount = 100;
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const colorData = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random();
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: size < 0.1 ? Math.random() * 2 + 3 : Math.random() * 1.5 + 1, // Some larger particles
        opacity: size < 0.1 ? Math.random() * 0.3 + 0.6 : Math.random() * 0.4 + 0.3,
        color: colorData.rgb,
        hue: colorData.hue,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      };
    });

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;

      // Clear canvas completely (no trail)
      ctx.fillStyle = 'rgba(10, 14, 26, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Update pulse
        particle.pulse += particle.pulseSpeed;
        const pulseScale = Math.sin(particle.pulse) * 0.3 + 1;

        // Mouse interaction - attract and glow
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let glowBoost = 1;
        if (distance < 200) {
          const force = (200 - distance) / 200;
          particle.vx -= (dx / distance) * force * 0.015;
          particle.vy -= (dy / distance) * force * 0.015;
          glowBoost = 1 + force * 0.5; // Reduced glow boost
        }

        // Damping
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // Draw glow (outer) - reduced intensity
        const glowRadius = particle.radius * pulseScale * 2;
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, glowRadius
        );
        gradient.addColorStop(0, `rgba(${particle.color}, ${particle.opacity * 0.15 * glowBoost})`);
        gradient.addColorStop(0.5, `rgba(${particle.color}, ${particle.opacity * 0.06 * glowBoost})`);
        gradient.addColorStop(1, `rgba(${particle.color}, 0)`);
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw particle core with less shadow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particle.color}, ${particle.opacity * glowBoost})`;
        ctx.shadowBlur = 4 * glowBoost;
        ctx.shadowColor = `rgba(${particle.color}, 0.4)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connections with gradient colors
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 180) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            
            // Create gradient for connection line - stronger
            const lineGradient = ctx.createLinearGradient(
              particle.x, particle.y,
              otherParticle.x, otherParticle.y
            );
            const opacity = (1 - distance / 180) * 0.44;
            lineGradient.addColorStop(0, `rgba(${particle.color}, ${opacity})`);
            lineGradient.addColorStop(1, `rgba(${otherParticle.color}, ${opacity})`);
            
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.15) 0%, rgba(10, 14, 26, 1) 40%, rgba(0, 0, 0, 1) 100%)',
      }}
    />
  );
}
