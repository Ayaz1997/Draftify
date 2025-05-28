
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
        if (!field.required) {
          validator = validator.optional().nullable(); 
        }
        break;
      case 'date':
        validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' });
        break;
      case 'textarea':
        validator = z.string();
        if (field.required) {
            validator = validator.min(1, { message: `${field.label} is required` });
        }
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
    if (field.required && field.type !== 'boolean' && field.type !== 'file' && field.type !== 'number') { 
        if (validator instanceof z.ZodString) {
            validator = validator.min(1, { message: `${field.label} is required` });
        }
    } else if (field.type !== 'boolean' && field.type !== 'file' && field.type !== 'number' && !field.required) {
      validator = validator.optional();
    }
    
    // Make all fields optional if not explicitly required (requirement removed for testing)
    if (!field.required) {
      if (field.type === 'number') {
        // For optional numbers, allow them to be undefined or null after coercion
        validator = z.coerce.number().optional().nullable();
      } else if (field.type === 'boolean') {
        // Optional booleans can be undefined
        validator = z.boolean().optional().default(field.defaultValue === true);
      } else {
        validator = validator.optional();
      }
    }
    shape[field.id] = validator;
  });
  return z.object(shape);
}


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
                sessionStorage.removeItem(editDataKey); 
                
                template.fields.forEach(field => {
                    if (!(field.id in initialValues)) { 
                        if (field.defaultValue !== undefined) {
                            initialValues[field.id] = field.defaultValue;
                        } else if (field.type === 'date') {
                            initialValues[field.id] = new Date().toISOString().split('T')[0];
                        } else if (field.type === 'number') {
                            initialValues[field.id] = undefined;
                        } else if (field.type === 'boolean') {
                            initialValues[field.id] = field.defaultValue === true; 
                        } else if (field.type === 'file') {
                            initialValues[field.id] = undefined;
                        } else {
                            initialValues[field.id] = '';
                        }
                    } else if (field.type === 'file' && typeof initialValues[field.id] === 'string' && initialValues[field.id].startsWith('data:image')) {
                        // File input cannot be pre-filled for display, but keep dataURI in form state
                    } else if (field.type === 'date' && !initialValues[field.id]) { // If stored date is empty, default to current
                        initialValues[field.id] = new Date().toISOString().split('T')[0];
                    }
                });
                return initialValues;
            }
        } catch (e) {
            console.error("Failed to load or parse edit data from session storage:", e);
        }
    }

    template.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
            initialValues[field.id] = field.defaultValue;
        } else if (field.type === 'date') {
            initialValues[field.id] = new Date().toISOString().split('T')[0];
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
    form.reset(getInitialValues());
  }, [getInitialValues, form, template.id]); 

  async function onSubmit(rawValues: z.infer<typeof formSchema>) {
    const submissionValues: Record<string, any> = { ...rawValues };
    const logoFieldDefinition = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    const logoFieldId = logoFieldDefinition?.id;

    if (logoFieldId) {
      // Initialize to empty string, will be overwritten if logo is valid and processed
      submissionValues[logoFieldId] = ''; 

      const logoValueFromForm = rawValues[logoFieldId];

      if (logoValueFromForm) { // Check if there's any value (FileList or existing data URI string)
        if (logoValueFromForm instanceof FileList && logoValueFromForm.length > 0) {
          const file = logoValueFromForm[0];
          let isValidFile = true;

          if (!file.type.startsWith('image/')) {
            toast({
              variant: 'destructive',
              title: 'Invalid File Type',
              description: 'Please upload an image file for the logo (e.g., PNG, JPG).',
            });
            isValidFile = false;
          } else if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
              variant: 'destructive',
              title: 'File Too Large',
              description: 'Logo image should be less than 5MB.',
            });
            isValidFile = false;
          }

          if (isValidFile) {
            try {
              const dataUri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target && typeof event.target.result === 'string') {
                    resolve(event.target.result);
                  } else {
                    reject(new Error('Failed to read file.'));
                  }
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
              });
              submissionValues[logoFieldId] = dataUri; // Set on successful conversion
            } catch (error) {
              console.error("Error converting file to data URI:", error);
              toast({
                variant: "destructive",
                title: "Logo Upload Failed",
                description: "Could not process the logo file. Please try again.",
              });
              // submissionValues[logoFieldId] remains '' due to initialization
            }
          } // else: isValidFile is false, submissionValues[logoFieldId] remains ''
        } else if (typeof logoValueFromForm === 'string' && logoValueFromForm.startsWith('data:image')) {
          // If it's already a data URI (e.g., from editing session storage), keep it
          submissionValues[logoFieldId] = logoValueFromForm;
        }
        // If logoValueFromForm was something else (e.g. empty FileList, empty string not data URI), it remains ''
      }
      // If rawValues[logoFieldId] was undefined/null, it remains ''
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
        return <Input type="date" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      case 'email':
        return <Input type="email" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      case 'file':
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value: fileValue, ...restFileProps } = formFieldControllerProps; 
        return (
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => formFieldControllerProps.onChange(e.target.files)} 
            {...restFileProps} 
            className="pt-2" 
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {template.fields.map((field) => (
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
            ))}
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

    