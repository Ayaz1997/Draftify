'use client';

import type { Template, FormData } from '@/types';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, Edit3, Printer } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DocumentPreviewProps {
  template: Template;
  formData: FormData;
}

export function DocumentPreview({ template, formData }: DocumentPreviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleEdit = () => {
    const data = searchParams.get('data');
    router.push(`/templates/${template.id}${data ? `?data=${data}` : ''}`);
    // Note: For a real app, you'd pass data back to prefill the form.
    // This can be done by updating DocumentForm to accept initialData from query params.
    // For simplicity here, we just navigate back.
    // A more robust solution would involve state management or encoding form data in the edit link if it's small.
    // For now, simple navigation back to form, data won't be pre-filled from here without more logic.
    // A better approach to "Edit" is to simply `router.back()` if the previous page was the form.
    // router.back();
    // However, since the `DocumentForm` now reads initial values from `searchParams`, we can construct the edit link.
    const formDataString = encodeURIComponent(JSON.stringify(formData));
     router.push(`/templates/${template.id}?initialData=${formDataString}`);

  };

  const handleDownloadPdf = () => {
    // Actual PDF generation is complex. This is a placeholder.
    // For a real app, you might use a library like jsPDF or a server-side PDF generation service.
    toast({
      title: "Download PDF (Simulated)",
      description: "In a real app, this would generate and download a PDF of your document.",
      variant: "default",
    });
    // Example: window.print() can be used for a basic "print to PDF" functionality
    // For better control, specific PDF libraries are needed.
    // Trigger browser print dialog
    window.print();
  };

  const handleShare = async () => {
    // Actual sharing is complex. This is a placeholder using Web Share API if available.
    const shareData = {
      title: `My ${template.name} Document`,
      text: `Check out my ${template.name} document created with DocuForm!`,
      // url: window.location.href, // Or a link to a downloadable/viewable version
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
  
  // Add a print-specific stylesheet
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
        padding: 20px; /* Adjust padding as needed for print */
        box-shadow: none !important;
        border: none !important;
      }
      .no-print {
        display: none !important;
      }
      /* Specific styles for letterhead printing */
      .print-friendly-letterhead {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important; /* Remove card padding for true letterhead feel */
        max-width: 100% !important; /* Ensure it uses full width */
      }
      .print-friendly-letterhead header, .print-friendly-letterhead footer {
         border-color: #ccc !important; /* Lighter border for print */
      }
    }
  `;

  return (
    <div className="space-y-8">
      <style>{printStyles}</style>
      <Card className="max-w-4xl mx-auto no-print">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">Document Preview: {template.name}</CardTitle>
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
        {template.previewLayout(formData)}
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
