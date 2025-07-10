import { Metadata } from 'next';
import TemplateGenerator from '@/components/templates/TemplateGenerator';

export const metadata: Metadata = {
  title: 'Template Generator - CreatorCompass',
  description: 'Generate customized content with AI-powered templates',
};

export default function TemplateGeneratorPage({
  params,
}: {
  params: { templateId: string };
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <TemplateGenerator templateId={params.templateId} />
    </div>
  );
}