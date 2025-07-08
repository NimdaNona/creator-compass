'use client';

import { TemplateGenerators } from '@/components/templates/TemplateGenerators';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <TemplateGenerators />
      </main>
      
      <Footer />
    </div>
  );
}