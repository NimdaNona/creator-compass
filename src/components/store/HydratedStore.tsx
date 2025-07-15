'use client';

import { useEffect, useState } from 'react';

interface HydratedStoreProps {
  children: React.ReactNode;
}

export function HydratedStore({ children }: HydratedStoreProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    // Return a loading state or placeholder during server-side rendering
    return null;
  }

  return <>{children}</>;
}