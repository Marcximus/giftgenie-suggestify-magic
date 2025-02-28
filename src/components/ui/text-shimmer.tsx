
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
  // Use motion[Component] syntax for custom elements
  const MotionComponent = motion[Component as keyof JSX.IntrinsicElements] || motion.div;

  // Calculate an appropriate spread based on text length
  const dynamicSpread = useMemo(() => {
    // Create a proportional spread that scales with text length but stays within reasonable bounds
    return Math.max(8, Math.min(children.length * spread, 50));
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-clip-text text-transparent overflow-hidden',
        className
      )}
      style={{
        backgroundImage: `
          linear-gradient(
            90deg, 
            transparent 0%, 
            var(--base-gradient-color, currentColor) 45%, 
            var(--base-gradient-color, currentColor) 55%, 
            transparent 100%
          ),
          linear-gradient(var(--base-color, #a1a1aa), var(--base-color, #a1a1aa))
        `,
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
      }}
      animate={{
        backgroundPosition: ['200% center', '-100% center'],
      }}
      transition={{
        repeat: Infinity,
        duration: duration * (0.5 + (children.length / 20)),
        ease: 'linear',
        repeatType: 'loop',
      }}
    >
      {children}
    </MotionComponent>
  );
}
