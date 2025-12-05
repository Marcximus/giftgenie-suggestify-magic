
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
  spread = 0.25,
}: TextShimmerProps) {
  // Use motion[Component] syntax for custom elements
  const MotionComponent = motion[Component as keyof JSX.IntrinsicElements] || motion.div;

  // Calculate optimal animation duration based on text length
  const optimalDuration = useMemo(() => {
    // Base duration plus a small logarithmic adjustment for text length
    return duration * (1 + Math.log10(Math.max(children.length, 10)) * 0.1);
  }, [children.length, duration]);

  // Calculate the gradient width based on text length
  const gradientWidth = useMemo(() => {
    // Fixed gradient width that doesn't vary with text length
    // This prevents the jumping effect caused by different gradient widths
    return 15; // 15% of the width is the sweet spot for most text lengths
  }, []);

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
        backgroundSize: '300% 100%', // Wider background size for smoother animation
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
      }}
      animate={{
        backgroundPosition: ['100% center', '0% center'], // More balanced animation range
      }}
      transition={{
        repeat: Infinity,
        duration: optimalDuration,
        ease: "linear",
        repeatType: "loop",
        repeatDelay: 0, // Remove delay between repetitions to avoid jumping
      }}
    >
      {children}
    </MotionComponent>
  );
}
