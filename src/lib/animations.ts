/**
 * Animation utilities for consistent, smooth animations across the app
 */

// Animation timing functions
export const TIMING = {
  // Easing functions
  easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  // Duration presets
  instant: '50ms',
  fast: '200ms',
  normal: '300ms',
  slow: '500ms',
  lazy: '800ms',
} as const;

// Animation presets
export const ANIMATIONS = {
  // Fade animations
  fadeIn: 'animate-fadeIn',
  fadeOut: 'animate-fadeOut',
  fadeInUp: 'animate-fadeInUp',
  fadeInDown: 'animate-fadeInDown',
  
  // Scale animations
  scaleIn: 'animate-scaleIn',
  scaleOut: 'animate-scaleOut',
  scaleBounce: 'animate-scaleBounce',
  
  // Slide animations
  slideInRight: 'animate-slideInRight',
  slideInLeft: 'animate-slideInLeft',
  slideInUp: 'animate-slideInUp',
  slideInDown: 'animate-slideInDown',
  
  // Special animations
  shake: 'animate-shake',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  ping: 'animate-ping',
  bounce: 'animate-bounce',
  wiggle: 'animate-wiggle',
  
  // Card animations
  cardHover: 'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
  cardPress: 'active:scale-[0.98]',
  
  // Button animations
  buttonHover: 'transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]',
  buttonPress: 'transform transition-transform duration-150',
  
  // List item animations
  listItem: 'transition-all duration-200 hover:translate-x-1 hover:bg-accent/50',
  
  // Notification animations
  notificationSlide: 'animate-slideInRight',
  notificationFade: 'animate-fadeIn',
} as const;

// Transition classes
export const TRANSITIONS = {
  // Base transitions
  all: 'transition-all',
  colors: 'transition-colors',
  opacity: 'transition-opacity',
  transform: 'transition-transform',
  
  // With timing
  fast: 'transition-all duration-200',
  normal: 'transition-all duration-300',
  slow: 'transition-all duration-500',
  
  // Complex transitions
  smooth: 'transition-all duration-300 ease-out',
  bounce: 'transition-all duration-300 cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'transition-all duration-500 cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Animation delays
export const DELAYS = {
  none: 'delay-0',
  short: 'delay-75',
  medium: 'delay-150',
  long: 'delay-300',
  veryLong: 'delay-500',
} as const;

// Stagger animations for lists
export const staggerAnimation = (index: number, baseDelay = 50) => ({
  animationDelay: `${index * baseDelay}ms`,
  opacity: 0,
  animation: 'fadeInUp 0.5s ease-out forwards',
});

// Scroll-triggered animations
export const scrollAnimation = {
  threshold: 0.1,
  rootMargin: '50px',
  animationClass: 'animate-fadeInUp',
};

// Hover effect utilities
export const hoverEffects = {
  lift: 'hover:-translate-y-1 hover:shadow-lg',
  glow: 'hover:shadow-xl hover:shadow-primary/20',
  scale: 'hover:scale-105',
  brightness: 'hover:brightness-110',
};

// Focus effect utilities
export const focusEffects = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  glow: 'focus:outline-none focus:shadow-lg focus:shadow-primary/20',
  scale: 'focus:scale-105',
};

// Animation keyframes (to be added to globals.css)
export const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes fadeInUp {
    from { 
      opacity: 0; 
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInDown {
    from { 
      opacity: 0; 
      transform: translateY(-20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.9);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes scaleOut {
    from { 
      opacity: 1;
      transform: scale(1);
    }
    to { 
      opacity: 0;
      transform: scale(0.9);
    }
  }
  
  @keyframes scaleBounce {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes slideInRight {
    from { 
      opacity: 0;
      transform: translateX(20px);
    }
    to { 
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideInLeft {
    from { 
      opacity: 0;
      transform: translateX(-20px);
    }
    to { 
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideInUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInDown {
    from { 
      opacity: 0;
      transform: translateY(-20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes wiggle {
    0%, 100% { transform: rotate(-3deg); }
    50% { transform: rotate(3deg); }
  }
  
  .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
  .animate-fadeOut { animation: fadeOut 0.5s ease-out; }
  .animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }
  .animate-fadeInDown { animation: fadeInDown 0.5s ease-out; }
  .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
  .animate-scaleOut { animation: scaleOut 0.3s ease-out; }
  .animate-scaleBounce { animation: scaleBounce 0.6s ease-out; }
  .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
  .animate-slideInLeft { animation: slideInLeft 0.3s ease-out; }
  .animate-slideInUp { animation: slideInUp 0.3s ease-out; }
  .animate-slideInDown { animation: slideInDown 0.3s ease-out; }
  .animate-wiggle { animation: wiggle 0.5s ease-in-out infinite; }
  .animate-shake { animation: shake-once 0.5s ease-in-out; }
`;

// React helper for animations
import React from 'react';

// Intersection Observer hook for scroll animations
export const useScrollAnimation = (options = {}) => {
  const ref = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return { ref, isVisible };
};

// Page transition wrapper
export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
};

// List item animation wrapper
export const AnimatedListItem = ({ 
  children, 
  index = 0,
  delay = 50 
}: { 
  children: React.ReactNode;
  index?: number;
  delay?: number;
}) => {
  return (
    <div 
      className="animate-fadeInUp opacity-0"
      style={{ animationDelay: `${index * delay}ms`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
};

// Card animation wrapper
export const AnimatedCard = ({ 
  children,
  className = '',
}: { 
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`${ANIMATIONS.cardHover} ${ANIMATIONS.cardPress} ${className}`}>
      {children}
    </div>
  );
};