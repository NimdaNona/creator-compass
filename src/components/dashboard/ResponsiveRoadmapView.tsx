'use client';

import { useState, useEffect } from 'react';
import { RoadmapView } from './RoadmapView';
import { MobileRoadmapView } from './MobileRoadmapView';

export function ResponsiveRoadmapView() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check initial screen size
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isMobile ? <MobileRoadmapView /> : <RoadmapView />;
}