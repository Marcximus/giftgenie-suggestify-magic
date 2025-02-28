
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

  // Calculate animation duration based on text length
  const adjustedDuration = useMemo(() => {
    return Math.min(duration * (1 + children.length / 100), duration * 1.5);
  }, [children.length, duration]);

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-gradient-to-r bg-[length:300%_100%]',
        'text-transparent bg-clip-text',
        'from-muted-foreground via-foreground to-muted-foreground',
        'dark:from-muted-foreground dark:via-foreground dark:to-muted-foreground',
        className
      )}
      initial={{ backgroundPosition: '0% center' }}
      animate={{ backgroundPosition: '100% center' }}
      transition={{
        repeat: Infinity,
        duration: adjustedDuration,
        ease: 'linear',
        repeatType: 'mirror',
      }}
    >
      {children}
    </MotionComponent>
  );
}
