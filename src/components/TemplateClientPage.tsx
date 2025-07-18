
'use client';

import type { Template, DocumentFormPropsTemplate, FormData } from '@/types';
import { DocumentForm } from '@/components/DocumentForm';
import { Printer, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMemo, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface TemplateClientPageProps {
  template: DocumentFormPropsTemplate & {
      description: string;
      previewLayout: (data: any) => React.ReactNode,
      icon: React.ElementType
  };
}

// This is the new Client Component that holds the interactive logic
export function TemplateClientPage({ template }: TemplateClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const params = { templateId: template.id };

  // We need to create the Zod schema dynamically based on the template fields
  const formSchema = useMemo(() => {
    if (!template) return z.object({});
    const shape: Record<string, z.ZodTypeAny> = {};
    template.fields.forEach((field) => {
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
    return z.object(shape);
  }, [template]);

  const methods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const formData = methods.watch();

  useEffect(() => {
    const editDataKey = `docuFormEditData-${params.templateId}`;
    const storedEditDataString = sessionStorage.getItem(editDataKey);

    if (storedEditDataString) {
      try {
        const parsedData = JSON.parse(storedEditDataString);
        methods.reset(parsedData);
        sessionStorage.removeItem(editDataKey);
      } catch (e) {
        console.error('Failed to parse edit data from session storage:', e);
      }
    } else {
        // Initialize with default values if no edit data is found
        const defaultValues: Record<string, any> = {};
        template?.fields.forEach(field => {
            if (field.type === 'date') {
                defaultValues[field.id] = field.defaultValue && typeof field.defaultValue === 'string' && field.defaultValue.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? field.defaultValue : new Date().toISOString().split('T')[0];
            } else if (field.defaultValue !== undefined) {
                defaultValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                defaultValues[field.id] = false;
            } else if (field.type === 'number') {
                defaultValues[field.id] = undefined;
            } else {
                defaultValues[field.id] = '';
            }
        });
        methods.reset(defaultValues);
    }
  }, [params.templateId, methods, template?.fields]);

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
            const dataKey = `docuFormPreviewData-${template?.id}`;
            sessionStorage.setItem(dataKey, JSON.stringify(values));
            router.push(`/templates/${template?.id}/preview`);
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

  const TemplateIcon = template.icon;
  const templateDataForForm: DocumentFormPropsTemplate = {
    id: template.id,
    name: template.name,
    fields: template.fields,
  };

  return (
    <FormProvider {...methods}>
        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
            {/* Left Column: Form */}
            <div className="w-full lg:w-1/2 lg:max-w-2xl">
                <div className="mb-8 text-center lg:text-left">
                    <TemplateIcon className="h-12 w-12 text-accent mx-auto lg:mx-0 mb-3" />
                    <h1 className="text-3xl font-bold text-primary">{template.name}</h1>
                    <p className="text-md text-foreground/70 mt-1">{template.description}</p>
                </div>
                <DocumentForm template={templateDataForForm} />
            </div>

            {/* Right Column: Live Preview (Desktop only) */}
            <div className="hidden lg:block w-full lg:w-1/2 sticky top-24">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary">Live Preview</h2>
                    <div className="flex gap-2">
                         <Button variant="default" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
                        </Button>
                    </div>
                </div>
                <div 
                  id="live-preview-area" 
                  className="bg-white rounded-lg shadow-lg overflow-auto max-h-[calc(100vh-10rem)] border"
                  style={{ transform: 'scale(0.95)', transformOrigin: 'top center' }}
                >
                  {template.previewLayout(formData as FormData)}
                </div>
            </div>
             {/* Mobile-only Preview Button */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50">
                <Button className="w-full" onClick={handleMobilePreview}>
                    Preview Document
                </Button>
            </div>
        </div>
    </FormProvider>
  );
}
