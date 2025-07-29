import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { z } from 'zod';

const exportSchema = z.object({
  format: z.enum(['pdf', 'csv', 'json', 'excel']),
  periodType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  startDate: z.string(),
  endDate: z.string(),
  sections: z.string() // comma-separated
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const params = exportSchema.parse(body);

    const sections = params.sections.split(',').filter(Boolean);
    const period = {
      start: new Date(params.startDate),
      end: new Date(params.endDate),
      type: params.periodType
    };

    const exportData = await analyticsService.exportAnalytics(
      session.user.id,
      period,
      params.format,
      sections
    );

    // Set appropriate headers based on format
    const headers: Record<string, string> = {
      'Content-Disposition': `attachment; filename=analytics-${params.format}-${Date.now()}.${params.format}`
    };

    switch (params.format) {
      case 'pdf':
        headers['Content-Type'] = 'application/pdf';
        break;
      case 'csv':
        headers['Content-Type'] = 'text/csv';
        break;
      case 'json':
        headers['Content-Type'] = 'application/json';
        break;
      case 'excel':
        headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
    }

    return new NextResponse(exportData, { headers });
  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}