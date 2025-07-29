'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '@/hooks/usePWA';

export function InstallPrompt() {
  const { isInstallable, isPWA, installPWA } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    await installPWA();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleShowInstructions = () => {
    setShowMobileInstructions(true);
  };

  // Don't show if already installed, dismissed, or not installable
  if (isPWA || isDismissed || (!isInstallable && !showMobileInstructions)) {
    return null;
  }

  // Check if iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      <AnimatePresence>
        {isInstallable && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            <Card className="border-primary/20 bg-background/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Install CreatorCompass</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Install our app for a better experience with offline access and notifications
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={handleInstall}>
                        Install Now
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                      >
                        Not Now
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 -mt-1"
                    onClick={handleDismiss}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile installation instructions */}
      <AnimatePresence>
        {showMobileInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowMobileInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="max-w-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Install Instructions</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowMobileInstructions(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {isIOS ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Smartphone className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm">Installing on iOS</p>
                      </div>
                      <ol className="space-y-2 text-sm text-muted-foreground">
                        <li>1. Tap the Share button in Safari</li>
                        <li>2. Scroll down and tap "Add to Home Screen"</li>
                        <li>3. Tap "Add" in the top right corner</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Monitor className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm">Installing on Android/Desktop</p>
                      </div>
                      <ol className="space-y-2 text-sm text-muted-foreground">
                        <li>1. Look for the install icon in your browser's address bar</li>
                        <li>2. Click "Install" when prompted</li>
                        <li>3. Follow the installation prompts</li>
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show instructions button for mobile users without install prompt */}
      {!isInstallable && !isPWA && !isDismissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 right-4 z-40"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={handleShowInstructions}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Install App
          </Button>
        </motion.div>
      )}
    </>
  );
}

// Update notification component
export function UpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = usePWA();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      setShowNotification(true);
    }
  }, [isUpdateAvailable]);

  if (!showNotification) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <Card className="border-primary/20 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <p className="text-sm">A new version is available!</p>
            <Button size="sm" onClick={updateServiceWorker}>
              Update
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNotification(false)}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-4 left-4 z-50"
    >
      <Card className="border-orange-500/20 bg-orange-500/10">
        <CardContent className="p-3">
          <p className="text-sm text-orange-500">
            You're offline - Some features may be limited
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}