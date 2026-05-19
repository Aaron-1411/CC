'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  value: number;
  children: React.ReactNode;
  className?: string;
}

export function PriceFlash({ value, children, className = '' }: Props) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value === prevRef.current) return;
    const dir = value > prevRef.current ? 'up' : 'down';
    prevRef.current = value;
    setFlash(dir);
    const t = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(t);
  }, [value]);

  const bg =
    flash === 'up'
      ? 'rgba(35,209,139,0.25)'
      : flash === 'down'
      ? 'rgba(240,82,82,0.25)'
      : 'transparent';

  return (
    <motion.span
      className={className}
      animate={{ backgroundColor: bg }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{ borderRadius: 3 }}
    >
      {children}
    </motion.span>
  );
}
