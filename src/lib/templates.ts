import templatesData from '@/data/templates.json';

export interface Template {
  id: string;
  name: string;
  description: string;
  platform: string;
  category: string;
  tags: string[];
  requiresPremium?: boolean;
}

// Export templates in the expected format for the generate page
export const templates: Template[] = Object.entries(templatesData.templates || {})
  .flatMap(([platform, categories]) => 
    Object.entries(categories as Record<string, any>)
      .flatMap(([category, items]) => 
        (Array.isArray(items) ? items : []).map((item: any) => ({
          id: `${platform}-${category}-${item.title?.toLowerCase().replace(/\s+/g, '-') || 'template'}`,
          name: item.title || 'Template',
          description: item.description || '',
          platform: platform === 'all' ? 'all' : platform,
          category,
          tags: item.tags || [],
          requiresPremium: item.premium || false,
        }))
      )
  );

// Get templates by platform
export const getTemplatesByPlatform = (platformId: string): Template[] => {
  return templates.filter(t => t.platform === 'all' || t.platform === platformId);
};

// Get template by ID
export const getTemplateById = (templateId: string): Template | undefined => {
  return templates.find(t => t.id === templateId);
};