'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Celebration } from '@/types/achievements';
import { AchievementUpgradeTrigger } from '@/components/upgrade/SmartUpgradeTrigger';
import {
  Crown,
  Star,
  Zap,
  Trophy,
  X
} from 'lucide-react';

interface CelebrationModalProps {
  celebration: Celebration;
  onClose: () => void;
}

export function CelebrationModal({ celebration, onClose }: CelebrationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showUpgradeTrigger, setShowUpgradeTrigger] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    
    // Start confetti if needed
    if (celebration.animation === 'confetti' || celebration.animation === 'fireworks') {
      const timer2 = setTimeout(() => setShowConfetti(true), 300);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    // Auto close after duration
    const closeTimer = setTimeout(() => {
      handleClose();
    }, celebration.duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(closeTimer);
    };
  }, [celebration.duration]);

  const handleClose = () => {
    setIsVisible(false);
    // Show upgrade trigger after achievement celebration for certain achievements
    if (celebration.type === 'achievement' && 
        ['first-task', 'week-streak', 'content-creator'].includes(celebration.title.toLowerCase())) {
      setShowUpgradeTrigger(true);
    }
    setTimeout(onClose, 300);
  };

  const getAnimationClass = () => {
    switch (celebration.animation) {
      case 'bounce':
        return 'animate-bounce';
      case 'pulse':
        return 'animate-pulse';
      case 'confetti':
      case 'fireworks':
        return 'animate-bounce';
      default:
        return '';
    }
  };

  const getTypeIcon = () => {
    switch (celebration.type) {
      case 'achievement':
        return Trophy;
      case 'level_up':
        return Crown;
      case 'streak':
        return Zap;
      case 'milestone':
        return Star;
      default:
        return Trophy;
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Confetti/Fireworks Background */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {celebration.animation === 'confetti' && (
            <div className="confetti-container">
              {Array.from({ length: 50 }, (_, i) => (
                <div
                  key={i}
                  className="confetti-piece"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    backgroundColor: celebration.color,
                  }}
                />
              ))}
            </div>
          )}
          {celebration.animation === 'fireworks' && (
            <div className="fireworks-container">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="firework"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: `${30 + (i % 2) * 20}%`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Content */}
      <Card 
        className={`relative mx-4 max-w-md w-full transform transition-all duration-500 ease-out ${
          isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-75 translate-y-8 opacity-0'
        } ${getAnimationClass()}`}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          borderColor: celebration.color,
          boxShadow: `0 20px 40px -15px ${celebration.color}40`
        }}
      >
        <CardContent className="p-6 text-center relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 w-6 h-6"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Main Icon */}
          <div 
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${getAnimationClass()}`}
            style={{ backgroundColor: `${celebration.color}20` }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl"
              style={{ backgroundColor: celebration.color }}
            >
              {celebration.icon || <TypeIcon className="w-6 h-6" />}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold mb-2" style={{ color: celebration.color }}>
            {celebration.title}
          </h3>

          {/* Type Badge */}
          <Badge 
            variant="secondary" 
            className="mb-3"
            style={{ backgroundColor: `${celebration.color}20`, color: celebration.color }}
          >
            <TypeIcon className="w-3 h-3 mr-1" />
            {celebration.type.replace('_', ' ').toUpperCase()}
          </Badge>

          {/* Message */}
          <p className="text-lg mb-6 text-muted-foreground">
            {celebration.message}
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Continue
            </Button>
            <Button 
              onClick={handleClose}
              className="flex-1"
              style={{ backgroundColor: celebration.color }}
            >
              <Star className="w-4 h-4 mr-2" />
              Awesome!
            </Button>
          </div>

          {/* Additional Achievement Details */}
          {celebration.type === 'achievement' && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Achievement unlocked! Check your profile to see all your earned badges.
              </p>
            </div>
          )}

          {celebration.type === 'level_up' && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                New perks and features are now available in your dashboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        .confetti-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear infinite;
          transform-origin: center;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .fireworks-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .firework {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          animation: firework-explode 1s ease-out forwards;
        }

        @keyframes firework-explode {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(30);
            opacity: 0.8;
          }
          100% {
            transform: scale(50);
            opacity: 0;
          }
        }

        .firework::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle,
            ${celebration.color} 0%,
            transparent 70%
          );
          border-radius: 50%;
        }
      `}</style>
      
      {/* Achievement Upgrade Trigger */}
      {showUpgradeTrigger && celebration.type === 'achievement' && (
        <AchievementUpgradeTrigger
          achievementName={celebration.title}
          onDismiss={() => setShowUpgradeTrigger(false)}
        />
      )}
    </div>
  );
}