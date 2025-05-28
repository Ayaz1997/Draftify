
'use client';

import type { TemplateField, FormData, DocumentFormPropsTemplate } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import React, { useCallback, useEffect } from 'react';

interface DocumentFormProps {
  template: DocumentFormPropsTemplate;
}

function createZodSchema(fields: TemplateField[]): z.ZodObject<any, any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    let validator: z.ZodTypeAny;
    switch (field.type) {
      case 'email':
        validator = z.string().email({ message: 'Invalid email address' });
        break;
      case 'number':
        validator = z.coerce.number({ invalid_type_error: 'Must be a number' });
        break;
      case 'date':
        validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' });
        break;
      case 'textarea':
        validator = z.string();
        break;
      case 'boolean':
        validator = z.boolean().default(field.defaultValue === true);
        break;
      case 'file':
        validator = z.any().optional();
        break;
      case 'text':
      default:
        validator = z.string();
        break;
    }
    // All fields are optional for testing
    if (field.type === 'number') {
      validator = z.coerce.number().optional().nullable();
    } else if (field.type === 'boolean') {
      validator = z.boolean().optional().default(field.defaultValue === true);
    } else {
      validator = validator.optional();
    }
    shape[field.id] = validator;
  });
  return z.object(shape);
}


const workOrderFieldGroups: Record<string, string[]> = {
  'Business Details': ['businessName', 'businessAddress', 'businessContactNumber', 'businessEmail', 'businessLogoUrl'],
  'Order Details': ['orderNumber', 'orderDate', 'expectedStartDate', 'expectedEndDate'],
  'Client Details': ['clientName', 'clientPhone', 'clientEmail', 'workLocation', 'orderReceivedBy'],
  'Work Order Specifics': [ 
    'generalWorkDescription', 'termsOfService', 
    'includeWorkDescriptionTable', 'workItem1Description', 'workItem1Area', 'workItem1Rate', 
    'workItem2Description', 'workItem2Area', 'workItem2Rate', 
    'workItem3Description', 'workItem3Area', 'workItem3Rate',
    'includeMaterialTable', 'materialItem1Name', 'materialItem1Unit', 'materialItem1Quantity', 'materialItem1PricePerUnit',
    'materialItem2Name', 'materialItem2Unit', 'materialItem2Quantity', 'materialItem2PricePerUnit',
    'materialItem3Name', 'materialItem3Unit', 'materialItem3Quantity', 'materialItem3PricePerUnit',
    'includeLaborTable', 'laborItem1TeamName', 'laborItem1NumPersons', 'laborItem1Amount',
    'laborItem2TeamName', 'laborItem2NumPersons', 'laborItem2Amount',
    'laborItem3TeamName', 'laborItem3NumPersons', 'laborItem3Amount',
    'otherCosts', 'taxRatePercentage',
    'approvedByName', 'dateOfApproval'
  ]
};


export function DocumentForm({ template }: DocumentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formSchema = createZodSchema(template.fields);

  const getInitialValues = useCallback(() => {
    const editDataKey = `docuFormEditData-${template.id}`;
    let initialValues: Record<string, any> = {};

    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            const storedEditData = sessionStorage.getItem(editDataKey);
            if (storedEditData) {
                initialValues = JSON.parse(storedEditData);
                sessionStorage.removeItem(editDataKey); // Clear after loading for edit

                // Ensure all template fields have a value, defaulting if necessary
                template.fields.forEach(field => {
                    if (!(field.id in initialValues)) { // If a new field was added to template
                        if (field.defaultValue !== undefined) {
                            initialValues[field.id] = field.defaultValue;
                        } else if (field.type === 'date') {
                            initialValues[field.id] = new Date().toISOString().split('T')[0];
                        } else if (field.type === 'number') {
                            initialValues[field.id] = undefined; // Or null, depending on preference for empty number
                        } else if (field.type === 'boolean') {
                             initialValues[field.id] = field.defaultValue === true;
                        } else if (field.type === 'file') {
                            initialValues[field.id] = undefined; // File inputs cannot be pre-filled this way
                        } else {
                            initialValues[field.id] = '';
                        }
                    } else if (field.type === 'file' && typeof initialValues[field.id] === 'string' && initialValues[field.id].startsWith('data:image')) {
                        // File input cannot be pre-filled for display, but keep dataURI in form state
                    } else if (field.type === 'date' && (!initialValues[field.id] || typeof initialValues[field.id] !== 'string' || !initialValues[field.id].match(/^\d{4}-\d{2}-\d{2}$/))) {
                        // If date from storage is invalid or missing, default to today
                        initialValues[field.id] = new Date().toISOString().split('T')[0];
                    }
                });
                return initialValues;
            }
        } catch (e) {
            console.error("Failed to load or parse edit data from session storage:", e);
            // Fall through to default initial values if session storage fails
        }
    }

    // Default initial values for a new form
    template.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
            initialValues[field.id] = field.defaultValue;
        } else if (field.type === 'date') {
            initialValues[field.id] = new Date().toISOString().split('T')[0]; // Default to current date
        } else if (field.type === 'number') {
            initialValues[field.id] = undefined;
        } else if (field.type === 'boolean') {
             initialValues[field.id] = field.defaultValue === true;
        } else if (field.type === 'file') {
            initialValues[field.id] = undefined;
        } else {
            initialValues[field.id] = '';
        }
    });
    return initialValues;
  }, [template.id, template.fields]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  });
  
  useEffect(() => {
    // Reset form with initial values when template or initial values logic changes
    // This helps ensure form is correctly populated if user navigates back/forth or template changes
    form.reset(getInitialValues());
  }, [getInitialValues, form, template.id]);


  async function onSubmit(rawValues: z.infer<typeof formSchema>) {
    const submissionValues: Record<string, any> = { ...rawValues };
    const logoFieldDefinition = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    const logoFieldId = logoFieldDefinition?.id;
  
    if (logoFieldId) {
      submissionValues[logoFieldId] = ''; // Initialize/ensure it's an empty string for the submission if not set
  
      const logoValueFromForm = rawValues[logoFieldId]; // This could be FileList, string (data URI from edit), or undefined
  
      if (logoValueFromForm) {
        if (logoValueFromForm instanceof FileList && logoValueFromForm.length > 0) {
          const file = logoValueFromForm[0];
          let isValidFile = true;
  
          if (!file.type.startsWith('image/')) {
            toast({
              variant: 'destructive',
              title: 'Invalid File Type',
              description: 'Please upload an image file for the logo (e.g., PNG, JPG, GIF).',
            });
            isValidFile = false;
            submissionValues[logoFieldId] = ''; // Explicitly set to empty on validation fail
          } else if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
              variant: 'destructive',
              title: 'File Too Large',
              description: 'Logo image should be less than 5MB.',
            });
            isValidFile = false;
            submissionValues[logoFieldId] = ''; // Explicitly set to empty on validation fail
          }
  
          if (isValidFile) {
            try {
              const dataUri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target && typeof event.target.result === 'string') {
                    resolve(event.target.result);
                  } else {
                    reject(new Error('FileReader did not return a string result.'));
                  }
                };
                reader.onerror = (error) => reject(error || new Error('FileReader error event.'));
                reader.readAsDataURL(file);
              });
              submissionValues[logoFieldId] = dataUri;
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error("CRITICAL: Error converting file to data URI:", errorMessage, error);
              toast({
                variant: "destructive",
                title: "Logo Upload Failed",
                description: `Could not process the logo file. Details: ${errorMessage}. Please try again.`,
              });
              submissionValues[logoFieldId] = ''; // Ensure it's empty on critical error
            }
          }
          // If !isValidFile, submissionValues[logoFieldId] is already set to '' by validation blocks
        } else if (typeof logoValueFromForm === 'string' && logoValueFromForm.startsWith('data:image')) {
          // This is a data URI, likely from an edit flow where the image wasn't changed. Preserve it.
          submissionValues[logoFieldId] = logoValueFromForm;
        }
        // If logoValueFromForm is an empty FileList or something else, it means no new file / keep existing or empty.
        // It's already initialized to '' or carries over string.
      }
      // If rawValues[logoFieldId] was undefined/null, submissionValues[logoFieldId] is already ''.
    }
  
    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            sessionStorage.setItem(`docuFormPreviewData-${template.id}`, JSON.stringify(submissionValues));
            router.push(`/templates/${template.id}/preview`);
        } catch (error) {
            console.error("Error saving to session storage:", error);
            toast({
                variant: "destructive",
                title: "Navigation Error",
                description: "Could not prepare data for preview. Please try again.",
            });
        }
    } else {
        toast({
            variant: "destructive",
            title: "Environment Error",
            description: "Session storage is not available. Cannot proceed to preview.",
        });
    }
  }
  

  const renderField = (field: TemplateField, formFieldControllerProps: any) => {
    const value = field.type === 'number' && formFieldControllerProps.value === undefined ? '' : formFieldControllerProps.value;

    switch (field.type) {
      case 'textarea':
        return <Textarea placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} rows={field.rows || 5} />;
      case 'number':
        return <Input type="number" placeholder={field.placeholder} {...formFieldControllerProps} value={value} step="any" />;
      case 'date':
        let dateValue = formFieldControllerProps.value || '';
        if (dateValue && typeof dateValue === 'string' && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            try {
                dateValue = new Date(dateValue).toISOString().split('T')[0];
            } catch { // Fallback if conversion fails
                dateValue = new Date().toISOString().split('T')[0];
            }
        } else if (!dateValue) { // If value is empty, default to today
             dateValue = new Date().toISOString().split('T')[0];
        }
        return <Input type="date" placeholder={field.placeholder} {...formFieldControllerProps} value={dateValue} />;
      case 'email':
        return <Input type="email" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      case 'file':
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value: fileValue, onChange: onFileChange, ...restFileProps } = formFieldControllerProps;
        return (
          <Input
            type="file"
            accept="image/*" // Only accept image files
            onChange={(e) => onFileChange(e.target.files)} // Pass FileList to react-hook-form
            {...restFileProps}
            className="pt-2" // Some padding for file input
          />
        );
      case 'boolean':
        return (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
            <FormControl>
              <Checkbox
                checked={formFieldControllerProps.value}
                onCheckedChange={formFieldControllerProps.onChange}
                id={field.id}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel htmlFor={field.id} className="font-normal">
                {field.label}
              </FormLabel>
              {field.placeholder && (
                <FormDescription className="text-xs">
                  {field.placeholder}
                </FormDescription>
              )}
            </div>
          </FormItem>
        );
      case 'text':
      default:
        return <Input type="text" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
    }
  };

  const renderFormField = (field: TemplateField) => (
    <FormField
      key={field.id}
      control={form.control}
      name={field.id as keyof z.infer<typeof formSchema>}
      render={({ field: formHookFieldRenderProps }) => (
        field.type === 'boolean' ? (
           renderField(field, formHookFieldRenderProps)
        ) : (
          <FormItem>
            <FormLabel className="font-semibold text-foreground/90">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
            <FormControl>
              {renderField(field, formHookFieldRenderProps)}
            </FormControl>
            {field.placeholder && !field.type.includes('area') && field.type !== 'boolean' && field.type !== 'file' && (
              <FormDescription className="text-xs text-muted-foreground">
                Example: {field.placeholder}
              </FormDescription>
            )}
             {field.type === 'file' && field.placeholder && (
              <FormDescription className="text-xs text-muted-foreground">
                {field.placeholder}
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )
      )}
    />
  );


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {template.id === 'work-order' ? (
              <>
                {Object.entries(workOrderFieldGroups).map(([sectionTitle, fieldIds], sectionIndex) => (
                  <div key={sectionTitle} className="space-y-6"> {/* Wrap section in a div for consistent spacing */}
                    <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                      {sectionTitle}
                    </h2>
                    {fieldIds.map(fieldId => {
                      const field = template.fields.find(f => f.id === fieldId);
                      if (!field) return null;
                      return renderFormField(field);
                    })}
                  </div>
                ))}
              </>
            ) : (
              template.fields.map((field) => renderFormField(field))
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-6">
             <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Eye className="mr-2 h-4 w-4" />
              Preview Document
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    