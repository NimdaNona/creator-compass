import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TEMPLATE_CATEGORIES } from '@/lib/template-system';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Transform categories for API response
    const categories = Object.values(TEMPLATE_CATEGORIES).map(category => ({
      id: category.id,
      label: category.label,
      types: Object.values(category.types).map(type => ({
        id: type.id,
        label: type.label
      }))
    }));

    return NextResponse.json({ categories });

  } catch (error) {
    console.error('Error fetching template categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}