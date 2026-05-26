'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export function NumberTicker({ value, prefix = '', suffix = '', decimals = 2, duration = 600, className = '' }: Props) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef<number | null>(null);
  const startValRef = useRef(value);
  const frameRef = useRef<number>(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    startValRef.current = display;
    startRef.current = null;

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(startValRef.current + (value - startValRef.current) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={`font-mono tabular-nums ${className}`} aria-live="polite">
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}
