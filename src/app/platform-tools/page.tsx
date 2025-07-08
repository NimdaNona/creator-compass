'use client';

import { PlatformFeatures } from '@/components/platform-features/PlatformFeatures';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PlatformToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <PlatformFeatures />
      </main>
      
      <Footer />
    </div>
  );
}