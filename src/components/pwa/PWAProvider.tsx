'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePWA } from '@/hooks/usePWA';

interface PWAContextValue {
  isInstallable: boolean;
  isPWA: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installPWA: () => Promise<void>;
  updateServiceWorker: () => void;
  clearCache: () => Promise<boolean>;
}

const PWAContext = createContext<PWAContextValue | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
  const pwaState = usePWA();

  return (
    <PWAContext.Provider value={pwaState}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWAContext() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within PWAProvider');
  }
  return context;
}