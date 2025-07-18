
'use client';

import type { Template, DocumentFormPropsTemplate, FormData } from '@/types';
import { DocumentForm } from '@/components/DocumentForm';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMemo, useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { templates } from '@/lib/templates'; // Import templates for client-side lookup
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';


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
            case 'file': validator = z.any(); break;
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
            else if (field.type === 'boolean' || field.type === 'file') validator = validator.optional();
            else validator = validator.optional().or(z.literal(''));
        }
        shape[field.id] = validator;
    });

    if (template.id === 'work-order') {
        shape['workItems'] = z.array(z.object({ description: z.string(), area: z.any(), rate: z.any() })).optional();
        shape['materials'] = z.array(z.object({ name: z.string(), quantity: z.any(), unit: z.string(), pricePerUnit: z.any() })).optional();
        shape['labor'] = z.array(z.object({ teamName: z.string(), numPersons: z.any(), amount: z.any() })).optional();
    }
    
    if (template.id === 'invoice' || template.id === 'claim-invoice') {
        const itemShape: any = { description: z.string(), unit: z.string(), quantity: z.any(), unitCost: z.any() };
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
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  
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
    const editDataKey = `docuFormEditData-${templateData.id}`;
    const storedEditDataString = sessionStorage.getItem(editDataKey);

    let initialValues: Record<string, any> = {};

    if (storedEditDataString) {
      try {
        initialValues = JSON.parse(storedEditDataString);
        sessionStorage.removeItem(editDataKey);
      } catch (e) {
        console.error('Failed to parse edit data from session storage:', e);
      }
    } else if (template) {
        // Initialize with default values if no edit data is found
        template.fields.forEach(field => {
            if (field.id.includes('.')) return; // Don't process nested definitions here
            
            if (field.type === 'date') {
                initialValues[field.id] = field.defaultValue && typeof field.defaultValue === 'string' && field.defaultValue.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? field.defaultValue : new Date().toISOString().split('T')[0];
            } else if (field.defaultValue !== undefined) {
                initialValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                initialValues[field.id] = false;
            } else if (field.type === 'number') {
                initialValues[field.id] = undefined;
            } else {
                initialValues[field.id] = '';
            }
        });
        
        // Specific client-side default for dynamic order number
        if (templateData.id === 'work-order' && !initialValues['orderNumber']) {
          initialValues['orderNumber'] = `WO-${Date.now().toString().slice(-6)}`;
        }
        
        // Initialize field arrays
        if (template.id === 'work-order') {
            initialValues['workItems'] = [{ description: '', area: '', rate: '' }];
            initialValues['materials'] = [{ name: '', quantity: '', unit: 'Pcs', pricePerUnit: '' }];
            initialValues['labor'] = [{ teamName: '', numPersons: '', amount: '' }];
        }
        if (template.id === 'invoice' || template.id === 'claim-invoice') {
             initialValues['items'] = [{ description: '', unit: 'pcs', quantity: '', unitCost: '', claimPercentage: template.id === 'claim-invoice' ? '' : undefined }];
        }
    }

    methods.reset(initialValues);

  }, [templateData.id, methods, template]);

  const handlePrint = () => {
    toast({
      title: "Print / Save PDF",
      description: "Use your browser's print functionality to save as PDF.",
      variant: "default",
    });
    // This uses a trick to print only the preview area.
    // A print-specific stylesheet could also be used.
    const previewElement = document.getElementById('live-preview-area');
    if (previewElement) {
      const printContents = previewElement.innerHTML;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      // We might need to re-initialize some things after this, but for now it's simple.
      window.location.reload(); 
    }
  };

  const handleMobilePreview = async () => {
    const isValid = await methods.trigger();
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please correct the errors before proceeding.",
      });
      return;
    }
    
    const values = methods.getValues();
     try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            const dataKey = `docuFormPreviewData-${templateData.id}`;
            sessionStorage.setItem(dataKey, JSON.stringify(values));
            router.push(`/templates/${templateData.id}/preview`);
        } else {
            throw new Error('Session storage is not available.');
        }
    } catch (e: any) {
        console.error('Error saving to session storage or navigating:', e);
        toast({
            variant: "destructive",
            title: "Error Proceeding to Preview",
            description: e.message || "Could not save data for preview.",
        });
    }
  };
  
  if (!template) {
    // This can happen briefly while the component is mounting
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
        <div className="flex lg:gap-8 lg:items-start relative">
            {/* Left Column: Form */}
            <div className={cn(
              "w-full transition-all duration-300 ease-in-out",
              isPreviewCollapsed ? "lg:w-full" : "lg:w-1/2 lg:max-w-2xl"
            )}>
                <div className="mb-8 text-center lg:text-left">
                    <TemplateIcon className="h-12 w-12 text-accent mx-auto lg:mx-0 mb-3" />
                    <h1 className="text-3xl font-bold text-primary">{template.name}</h1>
                    <p className="text-md text-foreground/70 mt-1">{template.description}</p>
                </div>
                <DocumentForm template={templateDataForForm} />
            </div>

            {/* Right Column: Live Preview (Desktop only) */}
            <div className={cn(
              "hidden lg:flex flex-col w-1/2 sticky top-20 transition-all duration-300 ease-in-out",
              isPreviewCollapsed && "w-0 opacity-0 -mr-12"
            )}>
                <div className="bg-muted/50 border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-primary">Live Preview</h2>
                      <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handlePrint}>
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

            {/* Desktop Preview Toggle Button */}
            <div className="hidden lg:block">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 bg-background rounded-full shadow-md transition-all duration-300 ease-in-out",
                  isPreviewCollapsed ? "left-0" : "left-1/2 -ml-4"
                )}
                style={{ zIndex: 40 }} /* Ensure it's above form but below mobile footer */
              >
                  <ChevronRight className={cn("h-5 w-5 transition-transform", isPreviewCollapsed && "rotate-180")} />
              </Button>
            </div>


             {/* Mobile-only Preview Button */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50">
                <Button className="w-full" onClick={methods.handleSubmit(handleMobilePreview)}>
                    Preview Document
                </Button>
            </div>
        </div>
    </FormProvider>
  );
}
