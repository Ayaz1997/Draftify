
import { templates } from '@/lib/templates';
import type { DocumentFormPropsTemplate } from '@/types';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TemplateClientPage } from '@/components/TemplateClientPage';

interface TemplatePageProps {
  params: {
    templateId: string;
  };
}

// This function needs to remain outside the component to work with Next.js
export async function generateStaticParams() {
  return templates.map((template) => ({
    templateId: template.id,
  }));
}

// This is now a Server Component
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

  // Prepare a serializable object for the Client Component.
  // We only pass data that can be serialized over the network.
  const templateDataForClient: DocumentFormPropsTemplate & { description: string } = {
    id: template.id,
    name: template.name,
    description: template.description,
    fields: template.fields,
  };

  return <TemplateClientPage templateData={templateDataForClient} />;
}

// Metadata generation remains a server-side function
export function generateMetadata({ params }: TemplatePageProps) {
  const template = templates.find((t) => t.id === params.templateId);
  return {
    title: template ? `${template.name} - My Biz Docs` : 'Template Not Found - My Biz Docs',
  };
}
