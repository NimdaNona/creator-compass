'use client';

import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary>
        <AnalyticsDashboard />
      </ErrorBoundary>
    </div>
  );
}