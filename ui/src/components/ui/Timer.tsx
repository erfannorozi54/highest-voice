'use client'

import { useState, useEffect } from 'react';

interface TimerProps {
  expiryTimestamp: number;
}

const Timer = ({ expiryTimestamp }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = expiryTimestamp - now;

      if (remaining <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTimestamp]);

  return <div className="text-2xl font-semibold">{timeLeft}</div>;
};

export default Timer;
