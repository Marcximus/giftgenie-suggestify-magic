
'use client';
import React, { useMemo, type JSX } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

export function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  // Use motion.create() instead of motion() to address the deprecation warning
  const MotionComponent = motion[Component as keyof JSX.IntrinsicElements] || motion.div;

  // Calculate a more effective spread based on text length
  const dynamicSpread = useMemo(() => {
    // Use a minimum spread to ensure visibility on short texts
    return Math.max(10, Math.min(children.length * spread, 100));
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-clip-text text-transparent',
        'bg-[length:300%_100%]',
        className
      )}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
      style={{
        '--spread': `${dynamicSpread}px`,
        backgroundImage: `linear-gradient(
          90deg,
          transparent 0%,
          var(--base-gradient-color, currentColor) 50%,
          transparent 100%
        ), linear-gradient(var(--base-color, #a1a1aa), var(--base-color, #a1a1aa))`,
      }}
    >
      {children}
    </MotionComponent>
  );
}
