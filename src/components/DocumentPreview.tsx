
'use client';

import type { FormData, DocumentPreviewPropsTemplateInfo } from '@/types';
import { templates } from '@/lib/templates.tsx'; 
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, Edit3, Printer, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Added for "Go Back to Form" button

interface DocumentPreviewProps {
  templateInfo: DocumentPreviewPropsTemplateInfo;
  // formData prop removed
}

export function DocumentPreview({ templateInfo }: DocumentPreviewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fullTemplate = templates.find(t => t.id === templateInfo.id);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
        const dataKey = `docuFormPreviewData-${templateInfo.id}`;
        try {
            const storedDataString = sessionStorage.getItem(dataKey);
            if (storedDataString) {
                const parsedData = JSON.parse(storedDataString);
                setFormData(parsedData);
                // Do not remove from sessionStorage here to allow page refresh
                // sessionStorage.removeItem(dataKey); 
            } else {
                setError('No document data found for preview. Please create the document again.');
            }
        } catch (e) {
            console.error('Failed to load or parse form data from session storage:', e);
            setError('There was an issue loading your document data.');
        } finally {
            setIsLoading(false);
        }
    } else {
        setError('Session storage is not available in this browser.');
        setIsLoading(false);
    }
  }, [templateInfo.id]);

  const handleEdit = () => {
    if (formData && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem(`docuFormEditData-${templateInfo.id}`, JSON.stringify(formData));
        router.push(`/templates/${templateInfo.id}`); // Navigate to the form page
      } catch (storageError) {
        console.error("Error saving edit data to session storage:", storageError);
        toast({
          variant: "destructive",
          title: "Navigation Error",
          description: "Could not prepare data for editing. Please try again.",
        });
      }
    } else if (!formData) {
         toast({
          variant: "destructive",
          title: "No Data",
          description: "Cannot edit as document data is missing.",
        });
    }
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
      // url: window.location.href, // URL won't contain data anymore
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        {/* You can replace this with a spinner component */}
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg text-muted-foreground">Loading document preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Preview Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline">
            <Link href={`/templates/${templateInfo.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Form
            </Link>
        </Button>
      </div>
    );
  }

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

  if (!formData) {
     return (
       <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">No Data for Preview</h1>
        <p className="text-muted-foreground mb-6">Could not retrieve document data. Please try creating it again.</p>
        <Button asChild variant="outline">
          <Link href={`/templates/${templateInfo.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Form
          </Link>
        </Button>
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
