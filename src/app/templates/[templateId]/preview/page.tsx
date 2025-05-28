
import { templates } from '@/lib/templates.tsx'; 
import type { DocumentPreviewPropsTemplateInfo, FormData } from '@/types';
import { DocumentPreview } from '@/components/DocumentPreview';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PreviewPageProps {
  params: {
    templateId: string;
  };
  // searchParams removed as data is no longer passed via URL
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const template = templates.find((t) => t.id === params.templateId);

  if (!template) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Template Not Found</h1>
        <p className="text-muted-foreground mb-6">The template you are looking for does not exist.</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Templates
          </Link>
        </Button>
      </div>
    );
  }
  
  // formData is now fetched by DocumentPreview from sessionStorage
  const templateInfoForPreview: DocumentPreviewPropsTemplateInfo = {
    id: template.id,
    name: template.name,
  };

  return (
    <DocumentPreview templateInfo={templateInfoForPreview} />
  );
}

export function generateMetadata({ params }: PreviewPageProps) {
  const template = templates.find((t) => t.id === params.templateId);
  return {
    title: template ? `Preview ${template.name} - DocuForm` : 'Preview Not Found - DocuForm',
  };
}
