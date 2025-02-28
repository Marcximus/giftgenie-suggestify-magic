
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
  maxSpread?: number;
}

export function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
  maxSpread = 80,
}: TextShimmerProps) {
  const MotionComponent = motion(Component as keyof JSX.IntrinsicElements);

  const dynamicSpread = useMemo(() => {
    // Calculate spread based on text length but cap it at maxSpread
    return Math.min(children.length * spread, maxSpread);
  }, [children, spread, maxSpread]);

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-clip-text text-transparent',
        '[--shimmer-color:theme(colors.gray.200)]',
        'dark:[--shimmer-color:theme(colors.gray.800)]',
        className
      )}
      style={{
        backgroundSize: '200% 100%',
        backgroundImage: `linear-gradient(90deg, 
          var(--base-color, #a1a1aa) 0%, 
          var(--base-gradient-color, #ffffff) 50%, 
          var(--base-color, #a1a1aa) 100%)`,
      }}
      animate={{
        backgroundPosition: ['200% 0', '0% 0']
      }}
      transition={{
        duration: duration,
        ease: 'linear',
        repeat: Infinity,
      }}
    >
      {children}
    </MotionComponent>
  );
}
