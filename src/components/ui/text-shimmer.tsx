
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
  duration = 2.5,
  spread = 0.25, // Changed default to be more subtle
}: TextShimmerProps) {
  // Use motion[Component] syntax for custom elements
  const MotionComponent = motion[Component as keyof JSX.IntrinsicElements] || motion.div;

  // Calculate optimal animation duration based on text length
  // Using a logarithmic scale to prevent too much variance
  const optimalDuration = useMemo(() => {
    // Base duration with small adjustment for text length
    // Using log scale prevents extreme durations
    return duration * (1 + Math.log10(Math.max(children.length, 10)) * 0.2);
  }, [children.length, duration]);

  // Calculate the gradient width as a percentage based on text length
  // Shorter text needs wider gradients relative to their length
  const gradientWidth = useMemo(() => {
    // For very short text, use wider gradients (as % of total width)
    // For longer text, use narrower gradients
    return Math.max(10, Math.min(25, 100 / (children.length * spread)));
  }, [children.length, spread]);

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-clip-text text-transparent',
        className
      )}
      style={{
        backgroundImage: `
          linear-gradient(
            90deg, 
            transparent 0%, 
            var(--base-gradient-color, currentColor) ${50 - gradientWidth/2}%, 
            var(--base-gradient-color, currentColor) ${50 + gradientWidth/2}%, 
            transparent 100%
          ),
          linear-gradient(var(--base-color, #a1a1aa), var(--base-color, #a1a1aa))
        `,
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
      }}
      animate={{
        backgroundPosition: ['120% center', '-20% center'],
      }}
      transition={{
        repeat: Infinity,
        duration: optimalDuration,
        ease: "linear",
        repeatType: "loop",
        repeatDelay: 0.5, // Add a slight pause between animations
      }}
    >
      {children}
    </MotionComponent>
  );
}
