
'use client';

import type { FormData, DocumentPreviewPropsTemplateInfo } from '@/types';
import { templates } from '@/lib/templates.tsx'; // Import the full templates array for client-side lookup
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, Edit3, Printer, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DocumentPreviewProps {
  templateInfo: DocumentPreviewPropsTemplateInfo; // Use the simplified info type
  formData: FormData;
}

export function DocumentPreview({ templateInfo, formData }: DocumentPreviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Find the full template details (including previewLayout) on the client-side
  const fullTemplate = templates.find(t => t.id === templateInfo.id);

  const handleEdit = () => {
    const formDataString = encodeURIComponent(JSON.stringify(formData));
    router.push(`/templates/${templateInfo.id}/form?initialData=${formDataString}`); // Assuming form is at /form, adjust if different
    // Or, if your form page is `/templates/[templateId]`, then:
    // router.push(`/templates/${templateInfo.id}?initialData=${formDataString}`);
  };

  const handleDownloadPdf = () => {
    toast({
      title: "Print / Save PDF",
      description: "Use your browser's print functionality to save as PDF.",
      variant: "default",
    });
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `My ${templateInfo.name} Document`,
      text: `Check out my ${templateInfo.name} document created with DocuForm!`,
      // url: window.location.href, 
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Document Shared", description: "Shared successfully via system dialog.", variant: "default" });
      } catch (err) {
        toast({ title: "Share Failed", description: `Could not share: ${err}`, variant: "destructive" });
      }
    } else {
       toast({
        title: "Share (Simulated)",
        description: "Web Share API not available. In a real app, this would integrate with email/messaging.",
        variant: "default",
      });
    }
  };
  
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      .printable-area, .printable-area * {
        visibility: visible;
      }
      .printable-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 20px; 
        box-shadow: none !important;
        border: none !important;
      }
      .no-print {
        display: none !important;
      }
      .print-friendly-letterhead {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important; 
        max-width: 100% !important; 
      }
      .print-friendly-letterhead header, .print-friendly-letterhead footer {
         border-color: #ccc !important; 
      }
    }
  `;

  if (!fullTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Preview Error</h1>
        <p className="text-muted-foreground mb-6">Could not load the preview for this document type.</p>
        <Button variant="outline" onClick={() => router.push('/')}>Go to Templates</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <style>{printStyles}</style>
      <Card className="max-w-4xl mx-auto no-print">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">Document Preview: {templateInfo.name}</CardTitle>
            <CardDescription className="text-foreground/70">Review your generated document below.</CardDescription>
          </div>
           <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit} size="sm">
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
            </Button>
            <Button variant="outline" onClick={handleShare} size="sm">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      <div className="printable-area bg-card p-0 md:p-6 rounded-lg shadow-lg border border-border">
        {fullTemplate.previewLayout(formData)}
      </div>

      <div className="max-w-4xl mx-auto mt-8 flex justify-end gap-3 no-print">
         <Button variant="outline" onClick={handleEdit}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Document
          </Button>
        <Button onClick={handleDownloadPdf} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
        </Button>
        <Button onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share Document
        </Button>
      </div>
    </div>
  );
}
