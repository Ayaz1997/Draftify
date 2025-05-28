
import { templates } from '@/lib/templates';
import type { Template } from '@/types';
import { DocumentForm } from '@/components/DocumentForm';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TemplatePageProps {
  params: {
    templateId: string;
  };
}

export async function generateStaticParams() {
  return templates.map((template) => ({
    templateId: template.id,
  }));
}

export default function TemplatePage({ params }: TemplatePageProps) {
  const template = templates.find((t) => t.id === params.templateId);

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Template Not Found</h1>
        <p className="text-muted-foreground mb-6">The template you are looking for does not exist or has been moved.</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Templates
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <template.icon className="h-12 w-12 text-accent mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-primary">{template.name}</h1>
        <p className="text-md text-foreground/70 mt-1">{template.description}</p>
      </div>
      <DocumentForm template={template as Template} />
    </div>
  );
}

export function generateMetadata({ params }: TemplatePageProps) {
  const template = templates.find((t) => t.id === params.templateId);
  return {
    title: template ? `${template.name} - DocuForm` : 'Template Not Found - DocuForm',
  };
}
