'use client';

import { ResourceLibrary } from '@/components/resources/ResourceLibrary';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <ResourceLibrary />
        </ErrorBoundary>
      </main>
      
      <Footer />
    </div>
  );
}