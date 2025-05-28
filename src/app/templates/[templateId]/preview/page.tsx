
import { templates } from '@/lib/templates';
import type { Template, FormData } from '@/types';
import { DocumentPreview } from '@/components/DocumentPreview';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PreviewPageProps {
  params: {
    templateId: string;
  };
  searchParams: {
    data?: string;
  };
}

export default function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const template = templates.find((t) => t.id === params.templateId);
  let formData: FormData = {};

  if (searchParams.data) {
    try {
      formData = JSON.parse(decodeURIComponent(searchParams.data));
    } catch (error) {
      console.error('Failed to parse form data:', error);
      // Handle error, e.g., show a message or redirect
    }
  }

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
  
  if (Object.keys(formData).length === 0 && searchParams.data) {
     return (
       <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Invalid Document Data</h1>
        <p className="text-muted-foreground mb-6">There was an issue loading your document data. Please try creating it again.</p>
        <Button asChild variant="outline">
          <Link href={`/templates/${template.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Form
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <DocumentPreview template={template as Template} formData={formData} />
  );
}

export function generateMetadata({ params }: PreviewPageProps) {
  const template = templates.find((t) => t.id === params.templateId);
  return {
    title: template ? `Preview ${template.name} - DocuForm` : 'Preview Not Found - DocuForm',
  };
}
