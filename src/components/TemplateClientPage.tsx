
'use client';

import type { Template, DocumentFormPropsTemplate, FormData } from '@/types';
import { DocumentForm } from '@/components/DocumentForm';
import { Printer, Eye, Save, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMemo, useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { templates } from '@/lib/templates'; // Import templates for client-side lookup
import { Card } from '@/components/ui/card';
import Link from 'next/link';


interface TemplateClientPageProps {
  templateData: DocumentFormPropsTemplate & {
      description: string;
  };
}

const createFormSchema = (template?: Template) => {
    if (!template) return z.object({});

    const shape: Record<string, z.ZodTypeAny> = {};

    template.fields.forEach((field) => {
        if (field.id.includes('.')) return; // Skip nested field definitions

        let validator: z.ZodTypeAny;
        switch (field.type) {
            case 'email': validator = z.string().email({ message: 'Invalid email address' }); break;
            case 'number': validator = z.preprocess((val) => (val === "" || val === null ? undefined : val), z.coerce.number({ invalid_type_error: 'Must be a number' })); break;
            case 'date': validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' }); break;
            case 'textarea': validator = z.string(); break;
            case 'boolean': validator = z.boolean().default(field.defaultValue === true); break;
            case 'file': validator = z.any(); break; // Allow any type for file, can be File object or string
            case 'select':
                if (field.options && field.options.length > 0) {
                    const enumValues = field.options.map(opt => opt.value) as [string, ...string[]];
                    validator = enumValues.length > 0 ? z.enum(enumValues) : z.string();
                } else {
                    validator = z.string();
                }
                break;
            default: validator = z.string(); break;
        }

        if (!field.required) {
            if (field.type === 'number') validator = validator.optional().nullable();
            else if (field.type === 'boolean') validator = validator.optional();
            else validator = validator.optional().or(z.literal(''));
        }
        shape[field.id] = validator;
    });

    if (template.id === 'work-order') {
        shape['workItems'] = z.array(z.object({ description: z.string().min(1, 'Required'), area: z.any(), rate: z.any() })).optional();
        shape['materials'] = z.array(z.object({ name: z.string().min(1, 'Required'), quantity: z.any(), unit: z.string(), pricePerUnit: z.any() })).optional();
        shape['labor'] = z.array(z.object({ teamName: z.string().min(1, 'Required'), numPersons: z.any(), amount: z.any() })).optional();
    }
    
    if (template.id === 'invoice' || template.id === 'claim-invoice') {
        const itemShape: any = { description: z.string().min(1, 'Required'), unit: z.string(), quantity: z.any(), unitCost: z.any() };
        if (template.id === 'claim-invoice') {
            itemShape.claimPercentage = z.any();
        }
        shape['items'] = z.array(z.object(itemShape)).optional();
    }


    return z.object(shape);
}


// This is the new Client Component that holds the interactive logic
export function TemplateClientPage({ templateData }: TemplateClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  
  // Find the full template object on the client-side using the ID
  const template = useMemo(() => templates.find(t => t.id === templateData.id), [templateData.id]);

  // We need to create the Zod schema dynamically based on the template fields
  const formSchema = useMemo(() => createFormSchema(template), [template]);

  const methods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
  });

  const formData = methods.watch();

  useEffect(() => {
    const subscription = methods.watch(() => {
      setIsSaved(false);
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  useEffect(() => {
    const editDataKey = `docuFormEditData-${templateData.id}`;
    const storedEditDataString = sessionStorage.getItem(editDataKey);
    const localDataKey = `docuFormData-${templateData.id}`;
    const storedLocalDataString = localStorage.getItem(localDataKey);


    let initialValues: Record<string, any> = {};

    if (storedEditDataString) {
      try {
        initialValues = JSON.parse(storedEditDataString);
        sessionStorage.removeItem(editDataKey); // CRUCIAL: Clear after loading to prevent re-use
      } catch (e) {
        console.error('Failed to parse edit data from session storage:', e);
      }
    } else if (storedLocalDataString) {
       try {
        initialValues = JSON.parse(storedLocalDataString);
        setIsSaved(true); // If loading from local storage, it's considered "saved"
      } catch (e) {
        console.error('Failed to parse data from local storage:', e);
      }
    }
    
    // If initialValues is still empty (no edit data or failed parse), set defaults
    if (Object.keys(initialValues).length === 0 && template) {
        template.fields.forEach(field => {
            if (field.id.includes('.')) return;
            
            if (field.type === 'date') {
                initialValues[field.id] = field.defaultValue && typeof field.defaultValue === 'string' && field.defaultValue.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? field.defaultValue : new Date().toISOString().split('T')[0];
            } else if (field.defaultValue !== undefined) {
                initialValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                initialValues[field.id] = false;
            } else if (field.type === 'number') {
                initialValues[field.id] = undefined;
            } else if (field.type === 'file') {
                initialValues[field.id] = null;
            } else {
                initialValues[field.id] = '';
            }
        });
        
        if (templateData.id === 'work-order' && !initialValues['orderNumber']) {
          initialValues['orderNumber'] = `WO-${Date.now().toString().slice(-6)}`;
        }
        
        if (template.id === 'work-order') {
            initialValues['workItems'] = initialValues['workItems'] || [{ description: '', area: '', rate: '' }];
            initialValues['materials'] = initialValues['materials'] || [{ name: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }];
            initialValues['labor'] = initialValues['labor'] || [{ teamName: '', numPersons: '', amount: '' }];
        }
        if (template.id === 'invoice' || template.id === 'claim-invoice') {
             initialValues['items'] = initialValues['items'] || [{ description: '', unit: 'pcs', quantity: '', unitCost: '', claimPercentage: template.id === 'claim-invoice' ? '' : undefined }];
        }
    }

    methods.reset(initialValues);

  }, [templateData.id, methods, template]);
  
  const processAndSaveData = async (data: Record<string, any>, storage: 'sessionStorage' | 'localStorage') => {
    const fileFields = template?.fields.filter(f => f.type === 'file') || [];
    const submissionValues = { ...data };

    for (const field of fileFields) {
        const fileValue = data[field.id];
        if (fileValue && fileValue instanceof File) {
            try {
                const dataUri = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target?.result as string);
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(fileValue);
                });
                submissionValues[field.id] = dataUri;
            } catch (error) {
                console.error(`Error processing file for ${field.id}:`, error);
                toast({
                    variant: "destructive",
                    title: "File Read Error",
                    description: `Could not read the file for ${field.label}.`,
                });
                submissionValues[field.id] = null; // Or keep original if you want to retry
                return null;
            }
        } else if (typeof fileValue === 'string' && fileValue.startsWith('data:image')) {
            submissionValues[field.id] = fileValue;
        } else if (!fileValue) {
            submissionValues[field.id] = null;
        }
    }
    
    try {
        if (typeof window !== 'undefined') {
            const storageKey = storage === 'localStorage' ? `docuFormData-${templateData.id}` : `docuFormPreviewData-${templateData.id}`;
            window[storage].setItem(storageKey, JSON.stringify(submissionValues));
            return submissionValues;
        }
    } catch (e: any) {
        console.error(`Error saving to ${storage}:`, e);
        toast({
            variant: "destructive",
            title: `Error Saving Data`,
            description: e.message || `Could not save data to ${storage}.`,
        });
        return null;
    }
    return null;
  };

  const handleSave = async () => {
    const currentData = methods.getValues();
    const savedData = await processAndSaveData(currentData, 'localStorage');
    if (savedData) {
        setIsSaved(true);
        toast({
            title: "Data Saved!",
            description: "Your document details have been saved to this browser.",
            variant: "default",
        });
    }
  };
  
  const showSaveReminderToast = () => {
    toast({
        variant: 'destructive',
        title: "Action Required",
        description: "Please save your document first to enable this action.",
    });
  };

  const handlePrint = () => {
    if (!isSaved) {
        showSaveReminderToast();
        return;
    }
    toast({
      title: "Print / Save PDF",
      description: "Use your browser's print functionality to save as PDF.",
      variant: "default",
    });
    const previewElement = document.getElementById('live-preview-area');
    if (previewElement) {
      const printContents = previewElement.innerHTML;
      const originalContents = document.body.innerHTML;
      const printStyles = `<style>
        @media print {
          body { margin: 0; padding: 0; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
        }
      </style>`;
      document.body.innerHTML = printStyles + printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); 
    }
  };

  const onSubmit = async (values: Record<string, any>) => {
    if (!isSaved) {
        showSaveReminderToast();
        return;
    }
    const dataForPreview = await processAndSaveData(values, 'sessionStorage');
    if (dataForPreview) {
        router.push(`/templates/${templateData.id}/preview`);
    } else {
        toast({
            variant: "destructive",
            title: "Error Proceeding to Preview",
            description: "Could not prepare data for the preview page.",
        });
    }
  };
  
  if (!template) {
    return <div>Loading template...</div>;
  }


  const TemplateIcon = template.icon;
  const templateDataForForm: DocumentFormPropsTemplate = {
    id: template.id,
    name: template.name,
    fields: template.fields,
  };

  return (
    <FormProvider {...methods}>
     <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
     <form onSubmit={methods.handleSubmit(onSubmit)}>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Card className="w-full">
          <div className="p-6 space-y-6">
             <div className="text-center lg:text-left">
              <TemplateIcon className="h-12 w-12 text-accent mx-auto lg:mx-0 mb-3" />
              <h1 className="text-3xl font-bold text-primary">{template.name}</h1>
              <p className="text-md text-foreground/70 mt-1">{template.description}</p>
            </div>
            <DocumentForm template={templateDataForForm} />
          </div>
        </Card>

        <div className="hidden lg:block sticky top-24">
            <div className="bg-muted/50 border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-primary">Live Preview</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSave} type="button">
                        <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} type="button" disabled={!isSaved}>
                        <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
                    </Button>
                  </div>
              </div>
              <div
                  id="live-preview-area"
                  className="bg-white rounded-lg shadow-inner overflow-auto max-h-[calc(100vh-12rem)] border"
              >
                  {template.previewLayout(formData as FormData)}
              </div>
            </div>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-background border-t z-50">
           <div className="flex gap-3">
             <Button variant="outline" className="w-full" size="lg" type="button" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button className="w-full" size="lg" type="button" onClick={methods.handleSubmit(onSubmit)} disabled={!isSaved}>
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
           </div>
        </div>
      </div>
      </form>
    </FormProvider>
  );
}
